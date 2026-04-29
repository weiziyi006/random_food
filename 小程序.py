from fastapi import FastAPI,HTTPException,Depends,Request,Query,Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import bcrypt
import jwt
import pyodbc
from typing import Union
from datetime import datetime, timedelta,UTC
from passlib.context import CryptContext
import random
import hashlib
import re,math,requests
from typing import Optional, List
class AdminLoginRequest(BaseModel):
    admin_account:str
    admin_pwd:str
class CollectRequest(BaseModel):
    userid: int
    shopid: int
class ScoreUpdateRequest(BaseModel):
    recordId: Union[int, str]
    userId: Union[int, str]
    score: float
app = FastAPI(title = '菜品盲盒后端')
app.add_middleware(
    CORSMiddleware,
    allow_origins = ['*'],
    allow_credentials = True,
    allow_methods = ['*'],
    allow_headers = ['*']
)
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=access_token_expire_days)
    to_encode.update({"exp": expire, "iat": datetime.now(UTC)})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=algorithm)
    return encoded_jwt
async def get_current_user(request: Request):
    token = request.headers.get("token")
    if not token:
        raise HTTPException(
            status_code=401,
            detail="未携带登录凭证，请先登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[algorithm])
        user_phone: str = payload.get("sub")
        if user_phone is None:
            raise HTTPException(status_code=401, detail="登录凭证无效")
        return {"user_phone": user_phone}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="登录已过期，请重新登录")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="登录凭证无效，请重新登录")
def get_db_connection():
    conn = pyodbc.connect(
        r'Driver={ODBC Driver 17 for SQL Server};'
        r'SERVER=localhost;'
        r'DATABASE=random_food;'
        r'Trusted_Connection=yes;'  # 用Windows身份验证连接
        # r'UID = ;' #用户名
        # r'PWD = ;' #密码
    )
    return conn
import traceback
from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    traceback.print_exc()
    print("422详细错误：", str(exc))
    return JSONResponse(status_code=200, content={"code": 500, "msg": str(exc), "data": None})
# 随机抽取一个可用菜品和店铺
@app.get('/random')
def random_food(userid: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        select top 1 category_name, shop_name, address, shopid from food_list where is_available = 1
        order by newid()""")
    res = cursor.fetchone()
    if not res:
        conn.close()
        return {
            'code': 400,
            'msg': '暂无可用店铺',
            'data': None
        }
    cursor.execute("""
        insert into food_draw_record (userid, category_name, shop_name, address, shopid,draw_type)
        values (?, ?, ?, ?, ?, ?)
    """, (userid, res[0], res[1], res[2], res[3], "random"))
    conn.commit()
    conn.close()
    return {
        'code': 200,
        'data': {
            'category_name': res[0],
            'shop_name': res[1],
            'address': res[2],
            'shopid': res[3]
        },
        'msg': '抽取成功'
    }
# 换菜品
@app.get('/re_random')
def re_random(category_name: str, userid: int):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            update food_list set is_available = 0 where category_name = ?
        """, (category_name,))
        conn.commit()
        cursor.execute("""
            select top 1 category_name, shop_name, address, shopid from food_list 
            where is_available = 1
            order by newid()
        """)
        res = cursor.fetchone()
        if not res:
            cursor.execute('update food_list set is_available = 1')
            conn.commit()
            cursor.execute("""
                select top 1 category_name, shop_name, address, shopid 
                from food_list 
                where is_available = 1
                order by newid()
            """)
            res = cursor.fetchone()
        if res:
            cursor.execute("""
                insert into food_draw_record (userid, category_name, shop_name, address, shopid)
                values (?, ?, ?, ?, ?)
            """, (userid, res[0], res[1], res[2], res[3]))
            conn.commit()
        return {
            'code': 200,
            'data': {
                'category_name': res[0],
                'shop_name': res[1],
                'address': res[2],
                'shopid': res[3]
            },
            'msg': '更换菜品成功'
        }
    finally:
        if conn:
            conn.close()
# 换店
@app.get('/change_shop')
def change_shop(category_name: str, shop_name: str, userid: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        update food_list set is_available = 0
        where category_name = ? and shop_name = ?
    """, (category_name, shop_name))
    conn.commit()
    cursor.execute("""
        select top 1 category_name, shop_name, address, shopid from food_list where category_name = ? and is_available = 1
        order by newid()
    """, (category_name,))
    res = cursor.fetchone()
    if res:
        cursor.execute("""
            insert into food_draw_record (userid, category_name, shop_name, address, shopid)
            values (?, ?, ?, ?, ?)
        """, (userid, res[0], res[1], res[2], res[3]))
        conn.commit()
    conn.close()
    if not res:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('update food_list set is_available = 1 where category_name = ?', (category_name,))
        conn.commit()
        conn.close()
        return {
            'code': 400,'data': None,'msg': '该菜品下已无其他店，已重置'}
    return {
        'code': 200,
        'data': {
            'category_name': res[0],
            'shop_name': res[1],
            'address': res[2],
            'shopid': res[3]
        },
        'msg': '换店成功'
    }
# 添加新菜品
class FoodCategory(BaseModel):
    category_name:str
@app.post('/add_food')
async def add_food(request:FoodCategory):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("select * from category where category_name = ?", (request.category_name,))
        existing_category = cursor.fetchone()
        if existing_category:
            return {'code': 400, 'msg': '该菜品大类已存在'}
        cursor.execute("insert into category(category_name) values (?)", (request.category_name,))
        conn.commit()
        return {'code': 200, 'msg': '添加成功！'}
    except Exception as e:
        conn.rollback()
        return {'code': 500, 'msg': f'添加失败：{str(e)}'}
    finally:
        cursor.close()
        conn.close()
# 添加新店铺
class Shop(BaseModel):
    shop_name:str
@app.post('/add_shop')
async def add_shop(request:Shop):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("select * from shop where shop_name = ?", (request.shop_name,))
        existing_shop = cursor.fetchone()
        if existing_shop:
            return {'code': 400, 'msg': '该店铺已存在'}
        cursor.execute("insert into shop(shop_name) values (?)", (request.shop_name,))
        conn.commit()
        return {'code': 200, 'msg': '添加成功！'}
    except Exception as e:
        conn.rollback()
        return {'code': 500, 'msg': f'添加失败：{str(e)}'}
    finally:
        cursor.close()
        conn.close()
# 获取所有菜品大类
@app.get('/categories')
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("select categoryid, category_name from category order by categoryid")
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return {'code': 200,'msg': '获取成功','data': [{'categoryid': r[0], 'category_name': r[1]} for r in result]}
# 获取所有店铺
@app.get('/shops')
def get_shops():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("select shopid, shop_name from shop order by shopid")
    result = cursor.fetchall()
    cursor.close()
    conn.close()
    return {'code': 200,'msg': '获取成功','data': [{'shopid': r[0], 'shop_name': r[1]} for r in result]}
# 删除菜品大类
@app.delete('/delete_food')
async def delete_food(
        request:Request,
        category_ids: str = Query(None, description="要删除的分类ID，用逗号分隔")
):
    if not category_ids:
        category_ids = request.url.query.split('=')[-1]
    if not category_ids:
        return {'code': 400, 'msg': '请选择要删除的分类'}
    try:
        category_ids = [int(id_str) for id_str in category_ids.split(',')]
    except ValueError:
        return {'code': 400, 'msg': '分类ID格式错误'}
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('select categoryid from category where category_name=?',('其他',))
        other_category = cursor.fetchone()
        if not other_category:
            return {'code': 500, 'msg': '缺少【其他】分类，请先创建'}
        other_categoryid = other_category[0]
        placeholders = ', '.join(['?'] * len(category_ids))
        cursor.execute(f'update food_list set categoryid=? where categoryid in ({placeholders})',
        [other_categoryid] + category_ids)
        cursor.execute(f'delete from category where categoryid in ({placeholders})',category_ids)
        conn.commit()
        return {'code': 200, 'msg': f'分类已删除，旗下菜品已转移到【其他】类'}
    except Exception as e:
        if conn:
            conn.rollback()
        print(f'删除分类时出错: {str(e)}')
        return {'code': 500, 'msg': f'删除失败: {str(e)}'}
    finally:
        if conn:
            cursor.close()
            conn.close()
# 删除店铺
@app.delete('/delete_shops')
def delete_shops(ids:List[int] = Query(...)):
    if not ids:
        return{'code':400,'msg':'请选择要删除的店铺'}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        placeholders = ','.join(['?']*len(ids))
        cursor.execute(f"""delete from food_list where shopid in ({placeholders})""", ids)
        cursor.execute(f"""delete from shop where shopid in ({placeholders})""", ids)
        conn.commit()
        return {'code': 200, 'msg': f'成功删除{len(ids)}家店铺'}
    except Exception as e:
        conn.rollback()
        print(e)
        return {'code': 500, 'msg': f'批量删除失败:{str(e)}'}
    finally:
        cursor.close()
        conn.close()
# 获取菜品总数和店铺总数
@app.get('/total_counts')
def get_total_counts():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('select count(*) from category')
    category_count = cursor.fetchone()[0]
    cursor.execute('select count(*) from shop')
    shop_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    return{'code':200,'msg':'查询成功','data':{'category_count':category_count,'shop_count':shop_count}}
# 管理员登录
SECRET_KEY = "e3a19a926eed0a59e66a5fe180c7e4fbbba80d0a912df79ca6844dc2f1e798fc" # JWT 密钥
algorithm = 'HS256'  #加密算法
access_token_expire_days = 7 #Token的过期时间
@app.post("/admin_login")
async def admin_login(
        request: AdminLoginRequest,
        conn: pyodbc.Connection = Depends(get_db_connection)
):
    if not request.admin_account or not request.admin_pwd:
        raise HTTPException(status_code=400, detail="账号和密码不能为空")
    cursor = conn.cursor()
    cursor.execute(
        "select id, admin_pwd from admins where admin_account = ?",(request.admin_account,)
    )
    admin = cursor.fetchone()
    if not admin:
        raise HTTPException(status_code=401, detail="账号或密码错误")
    # 验证密码
    admin_id, hashed_pwd = admin
    if not bcrypt.checkpw(request.admin_pwd.encode('utf-8'), hashed_pwd.encode('utf-8')): #bcrypt.checkpw()密码验证函数
        raise HTTPException(status_code=401, detail="账号或密码错误")
    # 生成 Token
    payload = {
        "admin_id": admin_id,
        "role": "admin",
        "exp": datetime.now(UTC) + timedelta(days=access_token_expire_days)
    }
    access_token = jwt.encode(payload, SECRET_KEY, algorithm=algorithm)
    return {
        "success": True,"msg": "登录成功","access_token": access_token,"token_type": "bearer"
    }
# 忘记密码（管理员）
@app.post("/forget-password-admin")
async def forget_password_admin(
    admin_phone: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    code: str = Body(..., embed=True)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "select code, expires_at from admin_codes where admin_phone = ? and is_used = 0",(admin_phone,))
        admin = cursor.fetchone()
        if not admin or not admin[0]:
            raise HTTPException(status_code=400, detail="请先获取验证码")
        if admin[0] != code:
            raise HTTPException(status_code=400, detail="验证码错误")
        if datetime.now() > admin[1] + timedelta(minutes=5):
            raise HTTPException(status_code=400, detail="验证码已过期")
        cursor.execute('select 1 from admins where admin_phone=?',(admin_phone,))
        if not cursor.fetchone():
            raise HTTPException(status_code=400,detail='手机号错误')
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'),bcrypt.gensalt()).decode('utf-8')# 加密新密码
        cursor.execute(
            "update admins set admin_pwd = ? where admin_phone = ?",(password_hash, admin_phone))
        cursor.execute("update admin_codes set is_used=1 where admin_phone=?",(admin_phone,))
        conn.commit()
        return {"success": True,"message": "密码修改成功"}
    except HTTPException as e:
        raise e
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=f"密码修改失败：{str(e)}")
    finally:
        if conn:
            conn.close()
# 发送验证码 （管理员）
@app.post("/send-code-admin")
async def send_code_admin(phone_number: str = Body(...,embed=True)):
    scene:str = Body('login',embed=True)
    conn = None
    code = str(random.randint(100000, 999999))
    expire_time = datetime.now() + timedelta(minutes=5)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "select id from admins where admin_phone = ?",(phone_number,))
        admin_exists = cursor.fetchone()
        if scene == 'login' and not admin_exists:
            raise HTTPException(status_code=400, detail="手机号错误")
        cursor.execute("select 1 from admin_codes where admin_phone=?",(phone_number,))
        code_exists = cursor.fetchone()
        if code_exists:
            cursor.execute("""
            update admin_codes set code=?,expires_at=?,is_used=0
            where admin_phone=?""",(code,expire_time,phone_number))
        else:
            cursor.execute("""
            insert into admin_codes(admin_phone,code,expires_at,is_used)
            values(?,?,?,0)""",(phone_number,code,expire_time))
        conn.commit()
        print(f"【测试验证码】手机号{phone_number}的验证码是: {code}")
        return {"success": True, "message": "验证码已发送"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"发送失败: {str(e)}")
    finally:
        if conn:
            conn.close()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# 发送验证码 （用户）
@app.post("/send-code")
async def send_code(
    phone_number: str = Body(..., embed=True),
    scene: str = Body('login', embed=True)
):
    conn = None
    code = str(random.randint(100000, 999999))
    expire_time = datetime.now() + timedelta(minutes=5)
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        # 检查用户是否存在
        cursor.execute("select userid from users where user_phone = ?", (phone_number,))
        user_exists = cursor.fetchone()
        if scene == 'login' and not user_exists:
            return {"code": 400, "msg": "该手机号未注册", "data": None}
        elif scene == 'register' and user_exists:
            return {"code": 400, "msg": "该手机号已注册", "data": None}
        cursor.execute("select 1 from verification_codes where user_phone=?", (phone_number,))
        code_exists = cursor.fetchone()
        if code_exists:
            cursor.execute("""
            update verification_codes set code=?,expires_at=?,is_used=0
            where user_phone=?""", (code, expire_time, phone_number))
        else:
            cursor.execute("""
            insert into verification_codes(user_phone,code,expires_at,is_used)
            values(?,?,?,0)""", (phone_number, code, expire_time))
        conn.commit()
        print(f"【测试验证码】手机号{phone_number}的验证码是: {code}")
        return {"code": 200, "msg": "验证码已发送", "data": None}
    except Exception as e:
        if conn:
            conn.rollback()
        return {"code": 500, "msg": f"发送失败: {str(e)}", "data": None}
    finally:
        if conn:
            conn.close()
# 用户注册接口
def encrypt_password(password:str)->str:
    password_with_key = f'{password}{SECRET_KEY}'
    return hashlib.sha256(password_with_key.encode('utf-8')).hexdigest()
@app.post("/register")
async def register(
        phone_number: str = Body(...),
        password: str = Body(...),
        code: str = Body(...)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('select 1 from users where user_phone=?',(phone_number,))
        if cursor.fetchone():
            return{'code':400,'msg':'该手机号已注册','data':None}
        cursor.execute("""
            select code,expires_at,is_used from verification_codes where user_phone = ?""", (phone_number,))
        vc_record = cursor.fetchone()
        if not vc_record:
            raise HTTPException(status_code=400, detail="请先获取验证码")
        db_code,expires_at,is_used = vc_record
        if is_used:
            raise HTTPException(status_code=400,detail='验证码已使用')
        if datetime.now() > expires_at:
            raise HTTPException(status_code=400,detail='验证码已过期')
        if db_code != code:
            raise HTTPException(status_code=400,detail='验证码错误')
        password_hash = encrypt_password(password)
        cursor.execute("insert into users(user_phone,user_pwd)values(?,?)", (phone_number,password_hash))
        cursor.execute("update verification_codes set is_used=1 where user_phone=?",(phone_number,))
        conn.commit()
        access_token = create_access_token(data={'sub':phone_number})
        return {"success": True, "message": "注册成功","data":{"token": access_token,"userInfo": {"phone": phone_number}}
                }
    except Exception as e:
        if conn:
            conn.rollback()
        return {"code": 500, "msg": f"注册失败", "data": None}
    finally:
        if conn:
            conn.close()
# 账号密码登录
@app.post("/user_login")
async def account_login(
        user_phone: str = Body(..., embed=True),
        password: str = Body(..., embed=True)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "select user_pwd from users where user_phone = ?",(user_phone,))
        user = cursor.fetchone()
        conn.close()
        if not user:
            return {"code":400, "msg":"该手机号未注册", "data":None}
        input_pwd_hash = encrypt_password(password)
        if user[0] != input_pwd_hash:
            return {"code":400, "msg":"手机号或密码错误", "data":None}
        access_token = create_access_token(data={"sub": user_phone})
        return {
            "code":200,"msg":"登录成功","data":{"token": access_token,"userInfo": {"phone": user_phone}}
        }
    except Exception as e:
        return {"code":500, "msg":f"登录失败：{str(e)}", "data":None}
# 手机验证码登录
@app.post("/code_login")
async def code_login(
    user_phone: str = Body(default=..., embed=True),
    code: str = Body(default=..., embed=True)
):
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("select userid from users where user_phone = ?", (user_phone,))
        if not cursor.fetchone():
            return {"code":400, "msg":"该手机号未注册", "data":None}
        cursor.execute("select code,expires_at,is_used from verification_codes where user_phone = ?",(user_phone,))
        vc_record = cursor.fetchone()
        if not vc_record:
            return {"code":400, "msg":"请先获取验证码", "data":None}
        db_code,expires_at,is_used = vc_record
        if is_used:
            return {"code":400, "msg":"验证码已使用", "data":None}
        if db_code != code:
            return {"code":400, "msg":"验证码错误", "data":None}
        if datetime.now() > expires_at:
            return {"code":400, "msg":"验证码已过期", "data":None}
        cursor.execute("update verification_codes set is_used=1 where user_phone=?",(user_phone,))
        conn.commit()
        access_token = create_access_token(data={"sub": user_phone})
        return {
            "code":200,"msg":"登录成功","data":{"token": access_token,"userInfo": {"phone": user_phone}}
        }
    except Exception as e:
        if conn:
            conn.rollback()
        return {"code":500, "msg":f"登录失败: {str(e)}", "data":None}
    finally:
        if conn:
            conn.close()
# 忘记密码（用户）
@app.post("/forget-password")
async def forget_password(
    user_phone: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    code: str = Body(..., embed=True)
):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("select code, expires_at from verification_codes where user_phone = ? and is_used = 0",(user_phone,))
        vc_record = cursor.fetchone()
        if not vc_record:
            return {"code":400, "msg":"请先获取验证码", "data":None}
        db_code, expires_at = vc_record
        if db_code != code:
            return {"code":400, "msg":"验证码错误", "data":None}
        if datetime.now() > expires_at:
            return {"code":400, "msg":"验证码已过期", "data":None}
        cursor.execute('select 1 from users where user_phone=?',(user_phone,))
        if not cursor.fetchone():
            return {"code":400, "msg":"该手机号未注册", "data":None}
        password_hash = encrypt_password(new_password)
        cursor.execute("update users set user_pwd = ? where user_phone = ?",(password_hash, user_phone))
        cursor.execute("update verification_codes set is_used=1 where user_phone=?",(user_phone,))
        conn.commit()
        return {"code":200, "msg":"密码修改成功", "data":None}
    except Exception as e:
        if conn:
            conn.rollback()
        return {"code":500, "msg":f"密码修改失败：{str(e)}", "data":None}
    finally:
        if conn:
            conn.close()
# 反馈与建议
@app.post('/feedback')
def submit_feedback(content: str = Body(...), email: str = Body(default='')):
    if not content.strip():
        return {'code': 400, 'msg': '反馈内容不能为空'}
    if email and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
        return {'code': 400, 'msg': '邮箱格式不正确'}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "insert into feedback (content, email) values (?, ?)",
            content.strip(),
            email.strip() if email.strip() else None
        )
        conn.commit()
        return {'code': 200, 'msg': '提交成功'}
    except Exception as e:
        conn.rollback()
        print(e)
        return {'code': 500, 'msg': f'提交失败:{str(e)}'}
    finally:
        cursor.close()
        conn.close()
# 管理员获取用户反馈
@app.get('/feedback')
def get_all_feedback():
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("select id, content, email from feedback")
        rows = cursor.fetchall()
        feedback_list = []
        for row in rows:
            feedback_list.append({"id": row[0],"content": row[1],"email": row[2]})
        return {"code": 200, "data": feedback_list}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        cursor.close()
        conn.close()
# 收藏/取消收藏
@app.post("/collect_shop")
def toggle_collect_shop(req: CollectRequest):
    userid = req.userid
    shopid = req.shopid
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("select * from user_collect where userid = ? and shopid = ?", userid, shopid)
        existing = cursor.fetchone()

        if existing:
            cursor.execute("delete from user_collect where userid = ? and shopid = ?", userid, shopid)
            is_collected = False
            msg = "取消收藏成功"
        else:
            cursor.execute("insert into user_collect (userid, shopid) values (?, ?)", userid, shopid)
            is_collected = True
            msg = "收藏成功"

        conn.commit()
        return {
            "code": 200,
            "msg": msg,
            "data": {
                "userid": userid,
                "shopid": shopid,
                "is_collected": is_collected
            }
        }
    except Exception as e:
        conn.rollback()
        return {"code": 500, "msg": f"操作失败: {str(e)}"}
    finally:
        cursor.close()
        conn.close()
# 检查店铺是否被收藏
@app.get("/is-collected")
def is_shop_collected(userid: str, shopid: str):
    try:
        userid_int = int(userid)
        shopid_int = int(shopid)
    except ValueError:
        return {"code": 400, "msg": "userid and shopid must be valid integers"}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("select * from user_collect where userid = ? and shopid = ?", userid_int, shopid_int)
        existing = cursor.fetchone()
        is_collected = existing is not None
        return {
            "code": 200,
            "data": {
                "userid": userid_int,
                "shopid": shopid_int,
                "is_collected": is_collected
            }
        }
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        cursor.close()
        conn.close()
# 获取用户收藏的店铺列表
@app.get("/getmycollect")
def get_user_collected_shops(userid: str=None):
    if not userid:
        return{"code":400,"msg":"userid is required"}
    try:
        userid_int = int(userid)
    except ValueError:
        return {"code": 400, "msg": "userid must be a valid integer"}
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            select s.shopid, s.shop_name, s.address from user_collect uc join shop s on uc.shopid = s.shopid
            where uc.userid = ?
        """, userid_int)
        rows = cursor.fetchall()
        collected_shops = []
        for row in rows:
            collected_shops.append({
                "shopid": row[0],
                "shop_name": row[1],
                "address": row[2],
                "is_collected": True
            })
        return {"code": 200, "data": collected_shops}
    except Exception as e:
        return {"code": 500, "msg": str(e)}
    finally:
        cursor.close()
        conn.close()
# 抽取记录
@app.get("/get_draw_records")
def get_draw_records(userid: int, limit: int = 15):
    if limit <= 0 or limit > 100:
        return {"code": 400, "msg": "limit 必须是 1-100 之间的整数"}
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            select id, category_name, shop_name, address, draw_time, draw_type from food_draw_record
            where userid = ? order by id desc
            offset 0 rows fetch next ? rows only;
        """, (userid, limit))
        columns = [d[0] for d in cursor.description]
        records = []
        for row in cursor.fetchall():
            record = dict(zip(columns, row))
            try:
                if record.get("draw_time"):
                    record["draw_time"] = record["draw_time"].strftime("%Y-%m-%d %H:%M:%S")
                else:
                    record["draw_time"] = "2025-01-01 00:00"
            except:
                record["draw_time"] = "2025-01-01 00:00"
            records.append(record)
        return {"code": 200, "msg": "success", "data": records}
    except Exception as e:
        return {"code": 500, "msg": f"服务器错误：{str(e)}"}
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
# 店铺排行
@app.get("/get_shop_rank")
def get_shop_rank():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            s.shopid,
            s.shop_name,
            ISNULL(MAX(f.category_name), ''),
            s.address,
            ISNULL(AVG(CAST(e.score AS DECIMAL(2,1))), 0) AS avg_score
        FROM shop s
        LEFT JOIN food_list f ON s.shopid = f.shopid
        LEFT JOIN shop_evaluate e ON s.shopid = e.shopid
        GROUP BY s.shopid, s.shop_name, s.address
        ORDER BY 
            avg_score DESC,         -- 有评分：从高到低
            s.shop_name ASC         -- 无评分：按店铺名字排序
    """)

    data = []
    for r in cursor.fetchall():
        score_val = r[4]
        data.append({
            "shopid": r[0],"shop_name": r[1],"category_name": r[2],"address": r[3],
            "score": round(float(score_val), 1) if score_val > 0 else "暂无评分"
        })

    conn.close()
    return {"code": 200, "data": data}
# 智能推荐算法
AMAP_KEY = "14de8de13639fd823a5783409fa78398"  # 高德API Key
WEATHER_CODE_MAP = {
    "01": "☀️",  # 晴
    "02": "⛅",  # 多云
    "03": "☁️",  # 阴
    "04": "🌫️",  # 雾
    "05": "🌧️",  # 小雨
    "06": "🌧️",  # 中雨
    "07": "🌧️",  # 大雨
    "08": "🌧️",  # 暴雨
    "09": "🌦️",  # 雷阵雨
    "10": "❄️",  # 小雪
    "11": "❄️",  # 中雪
    "12": "❄️",  # 大雪
    "13": "🌨️",  # 暴雪
    "18": "🌧️",  # 阵雨
    "25": "🌨️",  # 雨夹雪
    "20": "🌫️",  # 霾
}
WEATHER_TEXT_MAP = {
    "晴": "☀️",
    "多云": "⛅",
    "阴": "☁️",
    "雾": "🌫️",
    "小雨": "🌧️",
    "中雨": "🌧️",
    "大雨": "🌧️",
    "暴雨": "🌧️",
    "雷阵雨": "🌦️",
    "小雪": "❄️",
    "中雪": "❄️",
    "大雪": "❄️",
    "暴雪": "🌨️",
    "阵雨": "🌧️",
    "雨夹雪": "🌨️",
    "霾": "🌫️",
}
def get_real_weather(city_adcode: str = "130900") -> dict:
    default_weather = {
        "temp": 25,
        "weather": "晴",
        "weather_code": "01",
        "icon": "☀️"
    }
    if not isinstance(city_adcode, str) or not city_adcode.isdigit() or len(city_adcode) != 6:
        print(f"无效的城市编码：{city_adcode}，使用默认值")
        return default_weather
    weather_url = (
        f"https://restapi.amap.com/v3/weather/weatherInfo"
        f"?city={city_adcode}&key={AMAP_KEY}&extensions=base"
    )
    try:
        response = requests.get(
            weather_url,
            timeout=5,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        response.raise_for_status()
        weather_data = response.json()
        if (weather_data.get("status") != "1" or
                not weather_data.get("lives") or
                len(weather_data["lives"]) == 0):
            print(f"高德API返回无效数据：{weather_data}")
            return default_weather
        live_data = weather_data["lives"][0]
        temp = int(live_data.get("temperature", 25))
        weather = live_data.get("weather", "晴")
        weather_code = live_data.get("weatherCode", "01")
        icon = WEATHER_TEXT_MAP.get(weather, WEATHER_CODE_MAP.get(weather_code, "☀️"))
        print(f"高德返回：文字={weather}，编码={weather_code}，最终图标={icon}")
        return {
            "temp": temp,
            "weather": weather,
            "weather_code": weather_code,
            "icon": icon
        }
    except requests.exceptions.Timeout:
        print("获取天气超时（高德API响应过慢）")
        return default_weather
    except requests.exceptions.HTTPError as e:
        print(f"HTTP请求错误：{e}")
        return default_weather
    except ValueError:
        print("高德API返回非JSON格式数据")
        return default_weather
    except Exception as e:
        print(f"获取天气失败：{str(e)}")
        return default_weather
# 图床地址
image_mapping = {
    "早餐": "https://s41.ax1x.com/2026/02/15/pZLgsHO.md.png",
    "快餐炒菜": "https://s41.ax1x.com/2026/02/15/pZLgrDK.md.png",
    "饮品": "https://s41.ax1x.com/2026/02/15/pZLgwg1.md.png",
    "其他": "https://s41.ax1x.com/2026/02/15/pZLgDu6.md.png",
    "炸鸡汉堡": "https://s41.ax1x.com/2026/02/15/pZLg0jx.md.png",
    "滑蛋饭": "https://s41.ax1x.com/2026/02/15/pZLg6ED.md.png",
    "鸡公煲": "https://s41.ax1x.com/2026/02/15/pZLgRCd.md.png",
    "烤冷面": "https://s41.ax1x.com/2026/02/15/pZLgcUe.md.png",
    "烤肉拌饭": "https://s41.ax1x.com/2026/02/15/pZLgg4H.md.png",
    "烤鸭饭": "https://s41.ax1x.com/2026/02/21/pZjiGZR.md.png",
    "麻辣拌": "https://s41.ax1x.com/2026/02/21/pZjiaRO.md.png",
    "麻辣烫": "https://s41.ax1x.com/2026/02/21/pZjieI0.md.png",
    "麻辣香锅": "https://s41.ax1x.com/2026/02/21/pZjiYIx.md.png",
    "面": "https://s41.ax1x.com/2026/02/21/pZji3L9.md.png",
    "卤肉饭": "https://s41.ax1x.com/2026/02/21/pZjiJd1.md.png",
    "轻食简餐": "https://s41.ax1x.com/2026/02/21/pZji1sJ.md.png",
    "炸串": "https://s41.ax1x.com/2026/02/21/pZjiNi6.md.png",
    "default": "https://imgchr.com/i/pZLgsHO"
}
# 核心推荐算法
def calculate_recommend_score(food: dict, selected_tags: list, weather: dict) -> float:
    """计算店铺推荐得分：用户选择标签(45 %) + 天气(25 %) + 评分(20 %) + 收藏量(10 %)"""
    user_tag_w = 45
    weather_tag_w = 25
    score_w = 20
    collect_w = 10
    shop_tags = food["scene_tags"]
    collect_count = food["collect_count"]
    if not selected_tags:
        user_score = user_tag_w / 2
    else:
        matched = len(set(selected_tags) & set(shop_tags))
        user_score = (matched / len(selected_tags)) * user_tag_w
    temp = weather["temp"]
    weather_tag = ""
    if temp < 15:
        weather_tag = "暖胃"
    elif temp > 28:
        weather_tag = "解暑"
    weather_score = weather_tag_w if weather_tag in shop_tags else 0
    score_score = (float(food["score"]) / 5.0) * score_w
    collect_score = (math.log10(collect_count + 1) / math.log10(500 + 1)) * collect_w
    return round(user_score + weather_score + score_score + collect_score, 2)
# 智能推荐接口
@app.get("/smart-recommend")
def smart_recommend(
    userid: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    city_adcode: str = Query("130900")
):
    selected_tags = tags.split(',') if tags and tags != "" else []
    weather = get_real_weather(city_adcode)
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        sql = """
        select 
            f.shopid, f.shop_name, f.category_name, f.address,
            avg(cast(e.score as decimal(2,1))) as avg_score,
            isnull(uc.cnt, 0) as collect_count,
            isnull(string_agg(t.tag_name, ','), '') as scene_tags
        from food_list f
        left join shop_evaluate e on f.shopid = e.shopid
        left join (select shopid, count(*) cnt from user_collect group by shopid) uc on f.shopid = uc.shopid
        left join shop_scene_tags st on f.shopid = st.shopid
        left join scene_tags t on st.tag_id = t.tag_id
        group by f.shopid, f.shop_name, f.category_name, f.address, uc.cnt
        """
        cursor.execute(sql)
        rows = cursor.fetchall()
        if not rows:
            return {
                "code": 200,
                "msg": "暂无店铺数据",
                "data": None,
                "weather": weather
            }
        shop_list = []
        for row in rows:
            shop = {
                "shopid": row[0],
                "shop_name": row[1],
                "category_name": row[2],
                "address": row[3],
                "score": row[4] if row[4] is not None else 0.0,
                "collect_count": row[5],
                "scene_tags": row[6].split(',') if row[6] else []
            }
            shop["recommend_score"] = calculate_recommend_score(shop, selected_tags, weather)
            shop_list.append(shop)
        best_shop = max(shop_list, key=lambda x: x["recommend_score"])
        if userid:
            cursor.execute("""
                        insert into food_draw_record (userid, category_name, shop_name, address, shopid, draw_type)
                        values (?, ?, ?, ?, ?, ?)
                    """, (userid, best_shop["category_name"], best_shop["shop_name"], best_shop["address"],
                          best_shop["shopid"], 'smart'))
            conn.commit()
        is_collected = False
        if userid and best_shop:
            collect_sql = "select 1 from user_collect where userid=? and shopid=?"
            cursor.execute(collect_sql, (int(userid), best_shop["shopid"]))
            is_collected = cursor.fetchone() is not None
        category_name = best_shop["category_name"]
        image_url = image_mapping.get(category_name, image_mapping["default"])
        return {
            "code": 200,
            "msg": "推荐成功",
            "data": {
                **best_shop,
                "is_collected": is_collected,
                "image_url": image_url
            },
            "weather": weather
        }
    except Exception as e:
        print(f"推荐接口异常：{e}")
        return {
            "code": 500,
            "msg": f"服务器错误：{str(e)}",
            "data": None,
            "weather": weather
        }
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
# 提交评价
class EvaluateSubmit(BaseModel):
    userid: int
    shopid: int
    score: float
    content: Optional[str] = ""
@app.post("/submit_evaluate")
def submit_evaluate(data: EvaluateSubmit):
    print("收到评价数据：", data.model_dump())
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            select shop_name from food_list where shopid = ?
        """, int(data.shopid))
        row = cursor.fetchone()
        if not row:
            return {"code": 400, "msg": "无效的店铺ID"}
        shop_name = row[0]
        cursor.execute("""
            select shopid from shop where shop_name = ?
        """, shop_name)
        real_row = cursor.fetchone()
        if not real_row:
            return {"code": 400, "msg": "店铺不存在"}
        real_shopid = real_row[0]
        cursor.execute("""
            insert into shop_evaluate (userid, shopid, score, content) values (?, ?, ?, ?)
        """, (
            int(data.userid),real_shopid,float(data.score),str(data.content)
        ))
        conn.commit()
        return {"code": 200, "msg": "评价成功"}
    except Exception as e:
        print("错误：", e)
        return {"code": 500, "msg": "提交失败：" + str(e)}
    finally:
        if cursor is not None:
            try:
                cursor.close()
            except:
                pass
        if conn is not None:
            try:
                conn.close()
            except:
                pass
# 获取店铺评价列表
@app.get("/get_shop_evaluates")
def get_shop_evaluates(shopid: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        select id, score, content, create_timefrom shop_evaluate
        where shopid=? order by create_time desc
    """, (shopid,))
    rows = cursor.fetchall()
    arr = []
    for r in rows:
        arr.append({
            "id": r[0],
            "score": round(float(r[1]),1),
            "content": r[2],
            "create_time": r[3].strftime("%Y-%m-%d %H:%M") if r[3] else ""
        })
    conn.close()
    return {"code":200,"data":arr}
if __name__ == '__main__':
    uvicorn.run(app, host='0.0.0.0', port=8000)