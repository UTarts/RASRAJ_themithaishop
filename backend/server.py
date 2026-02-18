from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
import os
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]
JWT_SECRET = os.environ.get('JWT_SECRET', 'rasraj_secret')
JWT_ALGO = "HS256"

app = FastAPI(title="RAS RAJ API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── HELPERS ──────────────────────────────────────────────────────────────────

def doc(d):
    if not d:
        return None
    d = dict(d)
    d['id'] = str(d.pop('_id', ''))
    return d

def make_token(uid: str, role: str) -> str:
    return jwt.encode(
        {'sub': uid, 'role': role, 'exp': datetime.now(timezone.utc) + timedelta(days=30)},
        JWT_SECRET, algorithm=JWT_ALGO
    )

async def cur_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        raise HTTPException(401, "Not authenticated")
    try:
        p = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        u = await db.users.find_one({'_id': ObjectId(p['sub'])})
        if not u:
            raise HTTPException(401, "User not found")
        return doc(u)
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

async def opt_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        return None
    try:
        p = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        u = await db.users.find_one({'_id': ObjectId(p['sub'])})
        return doc(u) if u else None
    except:
        return None


# ── MODELS ────────────────────────────────────────────────────────────────────

class RegisterReq(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    password: str
    role: str = "customer"

class LoginReq(BaseModel):
    email: str
    password: str

class Address(BaseModel):
    label: str = "Home"
    line1: str
    line2: Optional[str] = None
    city: str
    state: str = "Uttar Pradesh"
    pincode: str
    phone: str

class CategoryReq(BaseModel):
    name: str
    name_hi: str
    slug: str
    emoji: Optional[str] = None
    image: Optional[str] = None
    order: int = 0

class ProductPrices(BaseModel):
    g250: float = 0
    g500: float = 0
    g1000: float = 0

class ProductReq(BaseModel):
    name: str
    name_hi: str
    description: str
    description_hi: Optional[str] = None
    category_slug: str
    prices: ProductPrices
    images: List[str] = []
    ingredients: Optional[str] = None
    shelf_life: Optional[str] = None
    in_stock: bool = True
    featured: bool = False
    badge: Optional[str] = None

class CartItemReq(BaseModel):
    product_id: str
    weight: str
    quantity: int = 1

class OrderItemReq(BaseModel):
    product_id: str
    product_name: str
    weight: str
    quantity: int
    price: float
    image: Optional[str] = None

class OrderReq(BaseModel):
    items: List[OrderItemReq]
    address: Address
    delivery_type: str = "delivery"
    payment_method: str = "cod"
    coupon_code: Optional[str] = None
    notes: Optional[str] = None

class StatusUpdate(BaseModel):
    status: str
    delivery_partner_id: Optional[str] = None


# ── AUTH ─────────────────────────────────────────────────────────────────────

@api_router.post("/auth/register")
async def register(data: RegisterReq):
    if await db.users.find_one({'email': data.email}):
        raise HTTPException(400, "Email already registered")
    pw = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
    r = await db.users.insert_one({
        'name': data.name, 'email': data.email, 'phone': data.phone,
        'password_hash': pw, 'role': data.role, 'addresses': [],
        'created_at': datetime.now(timezone.utc).isoformat()
    })
    token = make_token(str(r.inserted_id), data.role)
    return {'token': token, 'role': data.role, 'name': data.name, 'email': data.email, 'id': str(r.inserted_id)}

@api_router.post("/auth/login")
async def login(data: LoginReq):
    u = await db.users.find_one({'email': data.email})
    if not u or not bcrypt.checkpw(data.password.encode(), u['password_hash'].encode()):
        raise HTTPException(401, "Invalid credentials")
    token = make_token(str(u['_id']), u.get('role', 'customer'))
    return {'token': token, 'role': u.get('role', 'customer'), 'name': u.get('name', ''), 'email': u.get('email', ''), 'id': str(u['_id'])}

@api_router.get("/auth/me")
async def me(user=Depends(cur_user)):
    return user

@api_router.put("/auth/profile")
async def update_profile(data: dict, user=Depends(cur_user)):
    allowed = {k: v for k, v in data.items() if k in ['name', 'phone']}
    await db.users.update_one({'_id': ObjectId(user['id'])}, {'$set': allowed})
    return doc(await db.users.find_one({'_id': ObjectId(user['id'])}))

@api_router.post("/auth/address")
async def add_address(address: Address, user=Depends(cur_user)):
    addr = {**address.model_dump(), 'id': str(ObjectId())}
    await db.users.update_one({'_id': ObjectId(user['id'])}, {'$push': {'addresses': addr}})
    return addr

@api_router.delete("/auth/address/{addr_id}")
async def delete_address(addr_id: str, user=Depends(cur_user)):
    await db.users.update_one({'_id': ObjectId(user['id'])}, {'$pull': {'addresses': {'id': addr_id}}})
    return {'success': True}


# ── CATEGORIES ───────────────────────────────────────────────────────────────

@api_router.get("/categories")
async def get_cats():
    cats = await db.categories.find({}).sort('order', 1).to_list(100)
    return [doc(c) for c in cats]

@api_router.post("/categories")
async def create_cat(data: CategoryReq, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    r = await db.categories.insert_one(data.model_dump())
    return doc(await db.categories.find_one({'_id': r.inserted_id}))

@api_router.put("/categories/{cid}")
async def update_cat(cid: str, data: dict, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    await db.categories.update_one({'_id': ObjectId(cid)}, {'$set': data})
    return doc(await db.categories.find_one({'_id': ObjectId(cid)}))

@api_router.delete("/categories/{cid}")
async def delete_cat(cid: str, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    await db.categories.delete_one({'_id': ObjectId(cid)})
    return {'success': True}


# ── PRODUCTS ─────────────────────────────────────────────────────────────────

@api_router.get("/products/featured")
async def get_featured():
    prods = await db.products.find({'featured': True, 'in_stock': True}).limit(8).to_list(8)
    return [doc(p) for p in prods]

@api_router.get("/products")
async def get_prods(category: Optional[str] = None, search: Optional[str] = None, featured: Optional[bool] = None, limit: int = 50):
    q = {}
    if category and category != 'all':
        q['category_slug'] = category
    if featured is not None:
        q['featured'] = featured
    if search:
        q['$or'] = [{'name': {'$regex': search, '$options': 'i'}}, {'name_hi': {'$regex': search, '$options': 'i'}}, {'description': {'$regex': search, '$options': 'i'}}]
    prods = await db.products.find(q).limit(limit).to_list(limit)
    return [doc(p) for p in prods]

@api_router.get("/products/{pid}/recommendations")
async def get_recs(pid: str):
    p = await db.products.find_one({'_id': ObjectId(pid)})
    if not p:
        raise HTTPException(404, "Not found")
    recs = await db.products.find({'category_slug': p['category_slug'], '_id': {'$ne': ObjectId(pid)}}).limit(4).to_list(4)
    return [doc(r) for r in recs]

@api_router.get("/products/{pid}")
async def get_prod(pid: str):
    p = await db.products.find_one({'_id': ObjectId(pid)})
    if not p:
        raise HTTPException(404, "Not found")
    return doc(p)

@api_router.post("/products")
async def create_prod(data: ProductReq, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    d = {**data.model_dump(), 'created_at': datetime.now(timezone.utc).isoformat()}
    r = await db.products.insert_one(d)
    return doc(await db.products.find_one({'_id': r.inserted_id}))

@api_router.put("/products/{pid}")
async def update_prod(pid: str, data: dict, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    await db.products.update_one({'_id': ObjectId(pid)}, {'$set': data})
    return doc(await db.products.find_one({'_id': ObjectId(pid)}))

@api_router.delete("/products/{pid}")
async def delete_prod(pid: str, user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    await db.products.delete_one({'_id': ObjectId(pid)})
    return {'success': True}


# ── CART ─────────────────────────────────────────────────────────────────────

@api_router.get("/cart")
async def get_cart(user=Depends(cur_user)):
    cart = await db.carts.find_one({'user_id': user['id']})
    return doc(cart) if cart else {'items': [], 'user_id': user['id']}

@api_router.post("/cart/add")
async def add_cart(item: CartItemReq, user=Depends(cur_user)):
    cart = await db.carts.find_one({'user_id': user['id']})
    items = cart.get('items', []) if cart else []
    idx = next((i for i, x in enumerate(items) if x['product_id'] == item.product_id and x['weight'] == item.weight), None)
    if idx is not None:
        items[idx]['quantity'] += item.quantity
    else:
        items.append(item.model_dump())
    await db.carts.update_one({'user_id': user['id']}, {'$set': {'items': items}}, upsert=True)
    return {'success': True, 'items': items}

@api_router.put("/cart/update")
async def update_cart(item: CartItemReq, user=Depends(cur_user)):
    cart = await db.carts.find_one({'user_id': user['id']})
    if not cart:
        return {'success': True, 'items': []}
    items = cart.get('items', [])
    for i, x in enumerate(items):
        if x['product_id'] == item.product_id and x['weight'] == item.weight:
            if item.quantity <= 0:
                items.pop(i)
            else:
                items[i]['quantity'] = item.quantity
            break
    await db.carts.update_one({'user_id': user['id']}, {'$set': {'items': items}})
    return {'success': True, 'items': items}

@api_router.delete("/cart/clear")
async def clear_cart(user=Depends(cur_user)):
    await db.carts.update_one({'user_id': user['id']}, {'$set': {'items': []}})
    return {'success': True}


# ── ORDERS ───────────────────────────────────────────────────────────────────

VALID_STATUSES = ["placed", "accepted", "preparing", "packed", "out_for_delivery", "delivered", "cancelled"]

@api_router.post("/orders")
async def create_order(data: OrderReq, user=Depends(cur_user)):
    subtotal = sum(i.price * i.quantity for i in data.items)
    delivery_charge = 0 if data.delivery_type == 'pickup' or subtotal >= 500 else 40
    discount = 0
    if data.coupon_code:
        code = data.coupon_code.upper()
        if code == 'RASRAJ10':
            discount = round(subtotal * 0.10, 2)
        elif code == 'FIRST50':
            discount = min(50.0, subtotal)
        elif code == 'WELCOME20' and subtotal >= 500:
            discount = round(subtotal * 0.20, 2)
    total = subtotal + delivery_charge - discount
    order_doc = {
        'user_id': user['id'], 'user_name': user.get('name', ''), 'user_email': user.get('email', ''),
        'user_phone': user.get('phone', ''),
        'items': [i.model_dump() for i in data.items],
        'address': data.address.model_dump(),
        'delivery_type': data.delivery_type, 'payment_method': data.payment_method,
        'coupon_code': data.coupon_code, 'subtotal': subtotal, 'delivery_charge': delivery_charge,
        'discount': discount, 'total': total, 'status': 'placed',
        'status_history': [{'status': 'placed', 'timestamp': datetime.now(timezone.utc).isoformat()}],
        'notes': data.notes, 'delivery_partner_id': None,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'order_number': f"RR{int(datetime.now(timezone.utc).timestamp())}"
    }
    r = await db.orders.insert_one(order_doc)
    await db.carts.update_one({'user_id': user['id']}, {'$set': {'items': []}})
    return doc(await db.orders.find_one({'_id': r.inserted_id}))

@api_router.get("/orders")
async def get_orders(user=Depends(cur_user)):
    if user.get('role') == 'admin':
        orders = await db.orders.find({}).sort('created_at', -1).to_list(200)
    else:
        orders = await db.orders.find({'user_id': user['id']}).sort('created_at', -1).to_list(50)
    return [doc(o) for o in orders]

@api_router.get("/orders/{oid}")
async def get_order(oid: str, user=Depends(cur_user)):
    q = {'_id': ObjectId(oid)}
    if user.get('role') not in ['admin', 'delivery_partner']:
        q['user_id'] = user['id']
    o = await db.orders.find_one(q)
    if not o:
        raise HTTPException(404, "Order not found")
    return doc(o)

@api_router.put("/orders/{oid}/status")
async def update_status(oid: str, data: StatusUpdate, user=Depends(cur_user)):
    if user.get('role') not in ['admin', 'delivery_partner']:
        raise HTTPException(403, "Access denied")
    if data.status not in VALID_STATUSES:
        raise HTTPException(400, "Invalid status")
    update = {'status': data.status}
    if data.delivery_partner_id:
        update['delivery_partner_id'] = data.delivery_partner_id
    entry = {'status': data.status, 'timestamp': datetime.now(timezone.utc).isoformat()}
    await db.orders.update_one({'_id': ObjectId(oid)}, {'$set': update, '$push': {'status_history': entry}})
    return doc(await db.orders.find_one({'_id': ObjectId(oid)}))


# ── ADMIN ────────────────────────────────────────────────────────────────────

@api_router.get("/admin/dashboard")
async def dashboard(user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    today = datetime.now(timezone.utc).date().isoformat()
    all_orders = await db.orders.find({'status': {'$ne': 'cancelled'}}).to_list(1000)
    today_orders = [o for o in all_orders if o.get('created_at', '').startswith(today)]
    return {
        'total_orders': await db.orders.count_documents({}),
        'today_orders': len(today_orders),
        'today_revenue': sum(o.get('total', 0) for o in today_orders),
        'total_revenue': sum(o.get('total', 0) for o in all_orders),
        'total_products': await db.products.count_documents({}),
        'total_users': await db.users.count_documents({'role': 'customer'}),
        'recent_orders': [doc(o) for o in sorted(all_orders, key=lambda x: x.get('created_at', ''), reverse=True)[:5]],
        'low_stock': [doc(p) for p in await db.products.find({'in_stock': False}).limit(5).to_list(5)]
    }

@api_router.get("/admin/users")
async def get_users(user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    users = await db.users.find({}, {'password_hash': 0}).to_list(200)
    return [doc(u) for u in users]

@api_router.get("/admin/delivery-partners")
async def get_delivery_partners(user=Depends(cur_user)):
    if user.get('role') != 'admin':
        raise HTTPException(403, "Admin only")
    partners = await db.users.find({'role': 'delivery_partner'}, {'password_hash': 0}).to_list(50)
    return [doc(p) for p in partners]


# ── DELIVERY ─────────────────────────────────────────────────────────────────

@api_router.get("/delivery/orders")
async def delivery_orders(user=Depends(cur_user)):
    if user.get('role') not in ['admin', 'delivery_partner']:
        raise HTTPException(403, "Access denied")
    if user.get('role') == 'delivery_partner':
        orders = await db.orders.find({'delivery_partner_id': user['id']}).sort('created_at', -1).to_list(50)
    else:
        orders = await db.orders.find({'status': {'$in': ['accepted', 'preparing', 'packed', 'out_for_delivery']}}).sort('created_at', -1).to_list(100)
    return [doc(o) for o in orders]


# ── COUPONS ──────────────────────────────────────────────────────────────────

@api_router.post("/coupons/validate")
async def validate_coupon(body: dict):
    code = body.get('code', '').upper()
    subtotal = float(body.get('subtotal', 0))
    coupons = {
        'RASRAJ10': {'value': 10, 'type': 'percent', 'min': 200, 'desc': '10% off your order'},
        'FIRST50': {'value': 50, 'type': 'flat', 'min': 100, 'desc': '₹50 flat off'},
        'WELCOME20': {'value': 20, 'type': 'percent', 'min': 500, 'desc': '20% off on orders above ₹500'},
    }
    if code not in coupons:
        raise HTTPException(400, "Invalid coupon code")
    c = coupons[code]
    if subtotal < c['min']:
        raise HTTPException(400, f"Minimum order ₹{c['min']} required")
    discount = round(subtotal * c['value'] / 100, 2) if c['type'] == 'percent' else float(c['value'])
    return {'valid': True, 'discount': discount, 'description': c['desc']}


# ── SEED DATA ────────────────────────────────────────────────────────────────

async def do_seed():
    await db.categories.delete_many({})
    await db.products.delete_many({})
    await db.users.delete_many({'email': {'$in': ['admin@rasraj.com', 'delivery@rasraj.com']}})

    await db.users.insert_one({
        'name': 'Admin', 'email': 'admin@rasraj.com', 'phone': '9876543210',
        'password_hash': bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode(),
        'role': 'admin', 'addresses': [], 'created_at': datetime.now(timezone.utc).isoformat()
    })
    await db.users.insert_one({
        'name': 'Raju Kumar', 'email': 'delivery@rasraj.com', 'phone': '9876543211',
        'password_hash': bcrypt.hashpw(b'delivery123', bcrypt.gensalt()).decode(),
        'role': 'delivery_partner', 'addresses': [], 'created_at': datetime.now(timezone.utc).isoformat()
    })

    categories = [
        {'name': 'Milk Sweets', 'name_hi': 'दूध की मिठाई', 'slug': 'milk-sweets', 'emoji': '🍮', 'image': 'https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 1},
        {'name': 'Dry Fruit Sweets', 'name_hi': 'मेवे की मिठाई', 'slug': 'dry-fruit-sweets', 'emoji': '🌰', 'image': 'https://images.unsplash.com/photo-1755090154823-2832067d402b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400', 'order': 2},
        {'name': 'Namkeen', 'name_hi': 'नमकीन', 'slug': 'namkeen', 'emoji': '🥨', 'image': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 3},
        {'name': 'Gift Boxes', 'name_hi': 'गिफ्ट बॉक्स', 'slug': 'gift-boxes', 'emoji': '🎁', 'image': 'https://images.pexels.com/photos/35746481/pexels-photo-35746481.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 4},
        {'name': 'Cakes', 'name_hi': 'केक', 'slug': 'cakes', 'emoji': '🎂', 'image': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 5},
        {'name': 'Seasonal', 'name_hi': 'मौसमी विशेष', 'slug': 'seasonal', 'emoji': '✨', 'image': 'https://images.pexels.com/photos/28769884/pexels-photo-28769884.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 6},
        {'name': 'Snacks', 'name_hi': 'स्नैक्स', 'slug': 'snacks', 'emoji': '🥙', 'image': 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=400', 'order': 7},
    ]
    await db.categories.insert_many(categories)

    IMG = {
        'gulab': 'https://images.pexels.com/photos/14610769/pexels-photo-14610769.jpeg?auto=compress&cs=tinysrgb&w=400',
        'sweet1': 'https://images.pexels.com/photos/8887025/pexels-photo-8887025.jpeg?auto=compress&cs=tinysrgb&w=400',
        'sweet2': 'https://images.pexels.com/photos/28769884/pexels-photo-28769884.jpeg?auto=compress&cs=tinysrgb&w=400',
        'kaju': 'https://images.unsplash.com/photo-1755090154823-2832067d402b?crop=entropy&cs=srgb&fm=jpg&q=85&w=400',
        'gift': 'https://images.pexels.com/photos/35746481/pexels-photo-35746481.jpeg?auto=compress&cs=tinysrgb&w=400',
        'cake': 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400',
        'namkeen': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
        'snack': 'https://images.pexels.com/photos/1640771/pexels-photo-1640771.jpeg?auto=compress&cs=tinysrgb&w=400',
        'barfi': 'https://images.pexels.com/photos/8887025/pexels-photo-8887025.jpeg?auto=compress&cs=tinysrgb&w=400',
    }
    now = datetime.now(timezone.utc).isoformat()
    products = [
        {'name': 'Gulab Jamun', 'name_hi': 'गुलाब जामुन', 'description': 'Soft, spongy balls of khoya soaked in rose-flavoured sugar syrup. A timeless classic freshly prepared daily.', 'description_hi': 'खोये के मुलायम गोले जो गुलाब की चाशनी में डूबे हैं।', 'category_slug': 'milk-sweets', 'prices': {'g250': 200, 'g500': 380, 'g1000': 750}, 'images': [IMG['gulab'], IMG['sweet1']], 'ingredients': 'Khoya, Maida, Sugar, Rose Water, Cardamom', 'shelf_life': '3-4 days', 'in_stock': True, 'featured': True, 'badge': 'bestseller', 'created_at': now},
        {'name': 'Rasgulla', 'name_hi': 'रसगुल्ला', 'description': 'Light, spongy chenna balls in sugar syrup. Made fresh with premium quality cottage cheese.', 'description_hi': 'हल्के स्पंजी छेना के गोले चाशनी में।', 'category_slug': 'milk-sweets', 'prices': {'g250': 180, 'g500': 350, 'g1000': 680}, 'images': [IMG['sweet1']], 'ingredients': 'Chenna, Sugar, Rose Water', 'shelf_life': '2-3 days', 'in_stock': True, 'featured': True, 'badge': None, 'created_at': now},
        {'name': 'Motichoor Laddu', 'name_hi': 'मोतीचूर लड्डू', 'description': 'Fine gram flour pearls fried to perfection and bound with aromatic sugar syrup and dry fruits.', 'description_hi': 'बारीक बेसन के मोती, चाशनी और मेवे से बने लड्डू।', 'category_slug': 'milk-sweets', 'prices': {'g250': 250, 'g500': 480, 'g1000': 920}, 'images': [IMG['sweet2']], 'ingredients': 'Besan, Sugar, Ghee, Cardamom, Dry Fruits', 'shelf_life': '7-10 days', 'in_stock': True, 'featured': True, 'badge': 'bestseller', 'created_at': now},
        {'name': 'Soan Papdi', 'name_hi': 'सोन पापड़ी', 'description': 'Flaky, crispy threads of sweetness. Light and melt-in-mouth with hints of cardamom.', 'description_hi': 'कुरकुरी धागेदार मिठाई, मुंह में घुल जाने वाली।', 'category_slug': 'milk-sweets', 'prices': {'g250': 160, 'g500': 300, 'g1000': 580}, 'images': [IMG['sweet1']], 'ingredients': 'Besan, Sugar, Ghee, Cardamom', 'shelf_life': '15-20 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Milk Cake', 'name_hi': 'मिल्क केक', 'description': 'Dense, caramelized milk sweet with a rich taste. Cooked for hours to perfection.', 'description_hi': 'घने, कारामेलाइज्ड दूध से बनी मिठाई।', 'category_slug': 'milk-sweets', 'prices': {'g250': 220, 'g500': 420, 'g1000': 820}, 'images': [IMG['barfi']], 'ingredients': 'Full Cream Milk, Sugar, Cardamom', 'shelf_life': '5-7 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Besan Laddu', 'name_hi': 'बेसन लड्डू', 'description': 'Golden roasted gram flour laddu with aromatic ghee and mixed dry fruits. A festive favourite.', 'description_hi': 'भुने बेसन, घी और मेवे से बने सुनहरे लड्डू।', 'category_slug': 'milk-sweets', 'prices': {'g250': 200, 'g500': 380, 'g1000': 740}, 'images': [IMG['sweet2']], 'ingredients': 'Besan, Ghee, Sugar, Cardamom, Cashews, Raisins', 'shelf_life': '15-20 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Kalakand', 'name_hi': 'कलाकंद', 'description': 'Grainy milk-based sweet topped with silver vark. Made with reduced milk and sugar.', 'description_hi': 'दानेदार दूध की मिठाई, चांदी के वर्क से सजी।', 'category_slug': 'milk-sweets', 'prices': {'g250': 280, 'g500': 540, 'g1000': 1050}, 'images': [IMG['barfi']], 'ingredients': 'Full Cream Milk, Sugar, Cardamom, Silver Vark', 'shelf_life': '3-4 days', 'in_stock': True, 'featured': True, 'badge': 'premium', 'created_at': now},
        {'name': 'Khoya Barfi', 'name_hi': 'खोया बर्फी', 'description': 'Classic milk fudge made with pure khoya, garnished with pistachios. Rich and indulgent.', 'description_hi': 'शुद्ध खोये से बनी क्लासिक बर्फी, पिस्ते से सजी।', 'category_slug': 'milk-sweets', 'prices': {'g250': 220, 'g500': 420, 'g1000': 820}, 'images': [IMG['barfi']], 'ingredients': 'Khoya, Sugar, Pistachio, Cardamom', 'shelf_life': '4-5 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Imarti', 'name_hi': 'इमरती', 'description': 'Deep-fried spiral sweet made from black lentil batter soaked in sugar syrup.', 'description_hi': 'उड़द की दाल से बनी सर्पिल आकार की जलेबी।', 'category_slug': 'milk-sweets', 'prices': {'g250': 160, 'g500': 300, 'g1000': 580}, 'images': [IMG['gulab']], 'ingredients': 'Urad Dal, Sugar, Saffron', 'shelf_life': '1-2 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Khoya Peda', 'name_hi': 'खोया पेड़ा', 'description': 'Soft, melt-in-mouth khoya rounds flavored with cardamom and saffron. A temple classic.', 'description_hi': 'इलायची और केसर से सुगंधित खोया पेड़ा।', 'category_slug': 'milk-sweets', 'prices': {'g250': 240, 'g500': 460, 'g1000': 900}, 'images': [IMG['barfi']], 'ingredients': 'Khoya, Sugar, Cardamom, Saffron', 'shelf_life': '4-5 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Kaju Katli', 'name_hi': 'काजू कतली', 'description': 'Premium diamond-shaped cashew fudge with silver vark. Made with the finest quality cashews.', 'description_hi': 'प्रीमियम काजू से बनी हीरे के आकार की कतली, चांदी के वर्क से सजी।', 'category_slug': 'dry-fruit-sweets', 'prices': {'g250': 600, 'g500': 1150, 'g1000': 2200}, 'images': [IMG['kaju']], 'ingredients': 'Cashews, Sugar, Silver Vark, Cardamom', 'shelf_life': '15-20 days', 'in_stock': True, 'featured': True, 'badge': 'premium', 'created_at': now},
        {'name': 'Dry Fruit Barfi', 'name_hi': 'ड्राई फ्रूट बर्फी', 'description': 'Loaded with premium dry fruits — almonds, cashews, pistachios and walnuts in a sweet khoya base.', 'description_hi': 'बादाम, काजू, पिस्ता और अखरोट से भरपूर बर्फी।', 'category_slug': 'dry-fruit-sweets', 'prices': {'g250': 500, 'g500': 960, 'g1000': 1850}, 'images': [IMG['kaju']], 'ingredients': 'Khoya, Almonds, Cashews, Pistachios, Walnuts, Sugar', 'shelf_life': '10-15 days', 'in_stock': True, 'featured': True, 'badge': 'premium', 'created_at': now},
        {'name': 'Anjeer Barfi', 'name_hi': 'अंजीर बर्फी', 'description': 'Rich fig and dry fruit sweet, dense and nutritious. Packed with goodness of figs and nuts.', 'description_hi': 'अंजीर और मेवे से बनी पौष्टिक बर्फी।', 'category_slug': 'dry-fruit-sweets', 'prices': {'g250': 480, 'g500': 920, 'g1000': 1780}, 'images': [IMG['kaju']], 'ingredients': 'Figs, Almonds, Cashews, Dates, Sugar', 'shelf_life': '10-15 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Aloo Bhujia', 'name_hi': 'आलू भुजिया', 'description': 'Crispy potato and gram flour vermicelli seasoned with spices. The iconic Bikaner namkeen.', 'description_hi': 'करारी आलू और बेसन से बनी मसालेदार भुजिया।', 'category_slug': 'namkeen', 'prices': {'g250': 120, 'g500': 230, 'g1000': 450}, 'images': [IMG['namkeen']], 'ingredients': 'Potato, Besan, Spices, Oil', 'shelf_life': '30 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Mixture Namkeen', 'name_hi': 'मिक्सचर नमकीन', 'description': 'A delightful blend of sev, peanuts, poha, and spicy fried lentils. Perfect tea-time snack.', 'description_hi': 'सेव, मूंगफली, पोहा और दालों का मिश्रण।', 'category_slug': 'namkeen', 'prices': {'g250': 130, 'g500': 250, 'g1000': 490}, 'images': [IMG['namkeen']], 'ingredients': 'Sev, Peanuts, Poha, Dal, Spices', 'shelf_life': '30 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Mathri', 'name_hi': 'मठरी', 'description': 'Flaky, crispy crackers made from refined flour and spices. Perfect with chai or pickle.', 'description_hi': 'मैदे और मसालों से बनी कुरकुरी मठरी।', 'category_slug': 'namkeen', 'prices': {'g250': 100, 'g500': 190, 'g1000': 370}, 'images': [IMG['namkeen']], 'ingredients': 'Maida, Ghee, Spices, Salt', 'shelf_life': '20-25 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Chakli', 'name_hi': 'चकली', 'description': 'Spiral-shaped crispy snack made from rice flour and spices. Crunchy and addictive!', 'description_hi': 'चावल के आटे से बनी सर्पिल आकार की चकली।', 'category_slug': 'namkeen', 'prices': {'g250': 110, 'g500': 210, 'g1000': 400}, 'images': [IMG['namkeen']], 'ingredients': 'Rice Flour, Sesame Seeds, Spices', 'shelf_life': '20 days', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Diwali Gift Box', 'name_hi': 'दिवाली गिफ्ट बॉक्स', 'description': 'Premium gift box with an assortment of our finest sweets — Kaju Katli, Gulab Jamun, Soan Papdi and more. Beautifully packaged.', 'description_hi': 'काजू कतली, गुलाब जामुन, सोन पापड़ी का प्रीमियम उपहार डिब्बा।', 'category_slug': 'gift-boxes', 'prices': {'g250': 800, 'g500': 1500, 'g1000': 2800}, 'images': [IMG['gift']], 'ingredients': 'Assorted Premium Sweets', 'shelf_life': '7-10 days', 'in_stock': True, 'featured': True, 'badge': 'premium', 'created_at': now},
        {'name': 'Wedding Mithai Box', 'name_hi': 'वेडिंग मिठाई बॉक्स', 'description': 'Elegant wedding gift box perfect for shagun and wedding functions.', 'description_hi': 'शादी के लिए विशेष मिठाई का डिब्बा।', 'category_slug': 'gift-boxes', 'prices': {'g250': 1200, 'g500': 2200, 'g1000': 4000}, 'images': [IMG['gift']], 'ingredients': 'Premium Assorted Sweets', 'shelf_life': '7-10 days', 'in_stock': True, 'featured': True, 'badge': 'premium', 'created_at': now},
        {'name': 'Pista Cream Cake', 'name_hi': 'पिस्ता क्रीम केक', 'description': 'Moist pistachio cake with rich cream frosting. Perfect for birthdays and celebrations.', 'description_hi': 'पिस्ते की क्रीम से सजा मुलायम केक।', 'category_slug': 'cakes', 'prices': {'g250': 350, 'g500': 680, 'g1000': 1300}, 'images': [IMG['cake']], 'ingredients': 'Flour, Butter, Pistachio, Cream, Sugar', 'shelf_life': '2-3 days', 'in_stock': True, 'featured': False, 'badge': 'new', 'created_at': now},
        {'name': 'Rose Vanilla Cake', 'name_hi': 'रोज वेनिला केक', 'description': 'Soft vanilla sponge layered with rose cream and floral decorations.', 'description_hi': 'रोज क्रीम से सजा वेनिला स्पंज केक।', 'category_slug': 'cakes', 'prices': {'g250': 300, 'g500': 580, 'g1000': 1100}, 'images': [IMG['cake']], 'ingredients': 'Flour, Butter, Vanilla, Rose Cream, Sugar', 'shelf_life': '2-3 days', 'in_stock': True, 'featured': False, 'badge': 'new', 'created_at': now},
        {'name': 'Gajar Halwa', 'name_hi': 'गाजर का हलवा', 'description': 'Slow-cooked carrot halwa in pure ghee with khoya and dry fruits. A winter classic.', 'description_hi': 'शुद्ध घी में पकाया गाजर का हलवा।', 'category_slug': 'seasonal', 'prices': {'g250': 180, 'g500': 350, 'g1000': 680}, 'images': [IMG['barfi']], 'ingredients': 'Carrot, Khoya, Ghee, Sugar, Cardamom, Dry Fruits', 'shelf_life': '2-3 days', 'in_stock': True, 'featured': False, 'badge': 'seasonal', 'created_at': now},
        {'name': 'Gujiya', 'name_hi': 'गुझिया', 'description': 'Festive deep-fried dumplings filled with sweetened khoya and dry fruits. Holi special.', 'description_hi': 'मीठे खोये और मेवे से भरी होली की गुझिया।', 'category_slug': 'seasonal', 'prices': {'g250': 200, 'g500': 380, 'g1000': 740}, 'images': [IMG['gulab']], 'ingredients': 'Maida, Khoya, Sugar, Dry Fruits, Ghee', 'shelf_life': '5-7 days', 'in_stock': True, 'featured': False, 'badge': 'seasonal', 'created_at': now},
        {'name': 'Samosa (Pack of 4)', 'name_hi': 'समोसा (4 का पैक)', 'description': 'Crispy triangular pastry filled with spiced potatoes and peas. Freshly fried every morning.', 'description_hi': 'मसालेदार आलू और मटर से भरे करारे समोसे।', 'category_slug': 'snacks', 'prices': {'g250': 80, 'g500': 150, 'g1000': 280}, 'images': [IMG['snack']], 'ingredients': 'Maida, Potato, Peas, Spices, Oil', 'shelf_life': 'Same day', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Kachori (Pack of 4)', 'name_hi': 'कचौरी (4 का पैक)', 'description': 'Flaky deep-fried pastry with spiced lentil filling. Served fresh with chutney.', 'description_hi': 'मसालेदार दाल भरी करारी कचौरी।', 'category_slug': 'snacks', 'prices': {'g250': 80, 'g500': 150, 'g1000': 280}, 'images': [IMG['snack']], 'ingredients': 'Maida, Lentils, Spices, Oil', 'shelf_life': 'Same day', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
        {'name': 'Dahi Bhalla', 'name_hi': 'दही भल्ला', 'description': 'Soft lentil dumplings in creamy yogurt with sweet and tangy chutneys.', 'description_hi': 'मुलायम भल्ले दही और चटनी के साथ।', 'category_slug': 'snacks', 'prices': {'g250': 100, 'g500': 190, 'g1000': 360}, 'images': [IMG['snack']], 'ingredients': 'Urad Dal, Yogurt, Tamarind, Date Chutney', 'shelf_life': 'Same day', 'in_stock': True, 'featured': False, 'badge': None, 'created_at': now},
    ]
    await db.products.insert_many(products)
    return len(categories), len(products)

@api_router.post("/seed")
async def seed():
    cats, prods = await do_seed()
    return {'success': True, 'categories': cats, 'products': prods}


# ── STARTUP ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    count = await db.categories.count_documents({})
    if count == 0:
        logger.info("Seeding demo data...")
        await do_seed()
        logger.info("Seed complete.")


# ── SETUP ────────────────────────────────────────────────────────────────────

app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    client.close()
