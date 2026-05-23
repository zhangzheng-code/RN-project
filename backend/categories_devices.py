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
        # Query categories with device counts
        result = await session.execute(
            select(
                Category.id,
                Category.name,
                func.count(Device.id).label('device_count')
            ).outerjoin(Device, Category.id == Device.category_id)
            .group_by(Category.id, Category.name)
        )

        categories_data = [
            {
                "id": cat.id,
                "name": cat.name,
                "device_count": cat.device_count
            }
            for cat in result.all()
        ]

        return api_response(200, "获取分类列表成功", categories_data)

@categories_devices_bp.post('/categories')
@authorized()
@validate_json('name')
async def create_category(request: Request):
    """Create new category"""
    name = request.json['name']

    async for session in get_db():
        # Check if category already exists
        result = await session.execute(
            select(Category).where(Category.name == name)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "分类名称已存在")

        # Create new category
        new_category = Category(name=name)
        session.add(new_category)
        await session.commit()
        await session.refresh(new_category)

        return api_response(200, "创建分类成功", {
            "id": new_category.id,
            "name": new_category.name
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
                "category_id": dev.category_id
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
            model=model,
            category_id=category_id
        )
        session.add(new_device)
        await session.commit()
        await session.refresh(new_device)

        return api_response(200, "创建设备成功", {
            "id": new_device.id,
            "name": new_device.name,
            "model": new_device.model,
            "category_id": new_device.category_id
        })