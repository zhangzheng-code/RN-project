from sanic import Blueprint, Request
from sqlalchemy import select, delete, update, insert, func
from middleware import api_response, APIException, validate_json, authorized
from database import get_db
from models import Category, Device

categories_devices_bp = Blueprint('categories_devices', url_prefix='/api')

# Categories endpoints
@categories_devices_bp.get('/categories')
@authorized()
async def get_categories(request: Request):
    """Get all categories with device counts"""
    async for session in get_db():
        result = await session.execute(select(Category))
        categories = result.scalars().all()

        count_result = await session.execute(
            select(Category.id, func.count(Device.id).label('device_count'))
            .outerjoin(Device, Category.id == Device.category_id)
            .group_by(Category.id)
        )
        count_map = {row.id: row.device_count for row in count_result.all()}

        categories_data = [
            {
                "id": cat.id,
                "name": cat.name,
                "description": cat.description,
                "device_count": count_map.get(cat.id, 0)
            }
            for cat in categories
        ]

        return api_response(200, "获取分类列表成功", categories_data)

@categories_devices_bp.post('/categories')
@authorized()
@validate_json('name')
async def create_category(request: Request):
    """Create new category"""
    name = request.json['name']
    description = request.json.get('description', '')

    async for session in get_db():
        # Check if category already exists
        result = await session.execute(
            select(Category).where(Category.name == name)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "分类名称已存在")

        # Create new category
        new_category = Category(name=name, description=description or None)
        session.add(new_category)
        await session.commit()
        await session.refresh(new_category)

        return api_response(200, "创建分类成功", {
            "id": new_category.id,
            "name": new_category.name,
            "description": new_category.description,
        })

@categories_devices_bp.delete('/categories/<category_id:int>')
@authorized()
async def delete_category(request: Request, category_id: int):
    """Delete category with business rule check"""
    async for session in get_db():
        # Check if category exists and get device count
        result = await session.execute(
            select(
                Category,
                func.count(Device.id).label('device_count')
            ).outerjoin(Device, Category.id == Device.category_id)
            .where(Category.id == category_id)
            .group_by(Category.id)
        )

        row = result.first()
        if not row or not row.Category:
            raise APIException(404, "分类不存在")

        category, device_count = row.Category, row.device_count

        # Business rule: cannot delete if devices exist
        if device_count > 0:
            raise APIException(409, "业务冲突：分类下存在设备，无法删除")

        await session.delete(category)
        await session.commit()

        return api_response(200, "删除分类成功")

@categories_devices_bp.put('/categories/<category_id:int>')
@authorized()
@validate_json('name')
async def update_category(request: Request, category_id: int):
    """Update category"""
    name = request.json['name']
    description = request.json.get('description', '')

    async for session in get_db():
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()

        if not category:
            raise APIException(404, "分类不存在")

        result = await session.execute(
            select(Category).where(Category.name == name, Category.id != category_id)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "分类名称已存在")

        category.name = name
        category.description = description or None
        await session.commit()

        return api_response(200, "更新分类成功", {
            "id": category.id,
            "name": category.name,
            "description": category.description,
        })

# Devices endpoints
@categories_devices_bp.get('/devices')
@authorized()
async def get_devices(request: Request):
    """Get all devices, optionally filtered by category"""
    category_id = request.args.get('category_id', type=int)

    async for session in get_db():
        query = select(Device)
        if category_id:
            query = query.where(Device.category_id == category_id)

        result = await session.execute(query)
        devices = result.scalars().all()

        devices_data = [
            {
                "id": dev.id,
                "name": dev.name,
                "model": dev.model,
                "serial_number": dev.serial_number,
                "category_id": dev.category_id,
                "assigned_to": dev.assigned_to,
                "status": dev.status,
                "purchase_date": dev.purchase_date,
                "notes": dev.notes,
            }
            for dev in devices
        ]

        return api_response(200, "获取设备列表成功", devices_data)

@categories_devices_bp.post('/devices')
@authorized()
@validate_json('name', 'category_id')
async def create_device(request: Request):
    """Create new device"""
    name = request.json['name']
    category_id = request.json['category_id']
    model = request.json.get('model', '')
    serial_number = request.json.get('serial_number', '')
    assigned_to = request.json.get('assigned_to')
    status = request.json.get('status', 'available')
    purchase_date = request.json.get('purchase_date', '')
    notes = request.json.get('notes', '')

    async for session in get_db():
        # Check if category exists
        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()

        if not category:
            raise APIException(400, "指定的分类不存在")

        # Create new device
        new_device = Device(
            name=name,
            model=model or None,
            category_id=category_id,
            serial_number=serial_number or None,
            assigned_to=assigned_to,
            status=status,
            purchase_date=purchase_date or None,
            notes=notes or None,
        )
        session.add(new_device)
        await session.commit()
        await session.refresh(new_device)

        return api_response(200, "创建设备成功", {
            "id": new_device.id,
            "name": new_device.name,
            "model": new_device.model,
            "serial_number": new_device.serial_number,
            "category_id": new_device.category_id,
            "assigned_to": new_device.assigned_to,
            "status": new_device.status,
            "purchase_date": new_device.purchase_date,
            "notes": new_device.notes,
        })

@categories_devices_bp.put('/devices/<device_id:int>')
@authorized()
@validate_json('name', 'category_id')
async def update_device(request: Request, device_id: int):
    """Update device"""
    name = request.json['name']
    category_id = request.json['category_id']
    model = request.json.get('model', '')
    serial_number = request.json.get('serial_number', '')
    assigned_to = request.json.get('assigned_to')
    status = request.json.get('status', 'available')
    purchase_date = request.json.get('purchase_date', '')
    notes = request.json.get('notes', '')

    async for session in get_db():
        result = await session.execute(
            select(Device).where(Device.id == device_id)
        )
        device = result.scalar_one_or_none()

        if not device:
            raise APIException(404, "设备不存在")

        result = await session.execute(
            select(Category).where(Category.id == category_id)
        )
        if not result.scalar_one_or_none():
            raise APIException(400, "指定的分类不存在")

        device.name = name
        device.model = model or None
        device.category_id = category_id
        device.serial_number = serial_number or None
        device.assigned_to = assigned_to
        device.status = status
        device.purchase_date = purchase_date or None
        device.notes = notes or None

        await session.commit()

        return api_response(200, "更新设备成功", {
            "id": device.id,
            "name": device.name,
            "model": device.model,
            "serial_number": device.serial_number,
            "category_id": device.category_id,
            "assigned_to": device.assigned_to,
            "status": device.status,
            "purchase_date": device.purchase_date,
            "notes": device.notes,
        })