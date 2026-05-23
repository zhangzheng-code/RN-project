from sanic import Blueprint, Request
from sqlalchemy import select, delete, update, insert
from middleware import api_response, APIException, validate_json, authorized
from database import get_db
from models import Employee
import re

employees_bp = Blueprint('employees', url_prefix='/api/employees')

@employees_bp.get('/')
@authorized()
async def get_employees(request: Request):
    """Get all employees"""
    async for session in get_db():
        result = await session.execute(select(Employee))
        employees = result.scalars().all()

        employees_data = [
            {
                "id": emp.id,
                "name": emp.name,
                "age": emp.age,
                "email": emp.email
            }
            for emp in employees
        ]

        return api_response(200, "获取员工列表成功", employees_data)

@employees_bp.post('/')
@authorized()
@validate_json('name', 'age', 'email')
async def create_employee(request: Request):
    """Create new employee"""
    name = request.json['name']
    age = request.json['age']
    email = request.json['email']

    # Validation
    if not (1 <= len(name) <= 20):
        raise APIException(400, "参数校验失败: 姓名长度必须在1-20个字符之间")

    if not isinstance(age, int) or not (18 <= age <= 60):
        raise APIException(400, "参数校验失败: 年龄必须在18-60岁之间")

    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise APIException(400, "参数校验失败: 邮箱格式不正确")

    async for session in get_db():
        # Check if email already exists
        result = await session.execute(
            select(Employee).where(Employee.email == email)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "参数校验失败: 邮箱已存在")

        # Create new employee
        new_employee = Employee(
            name=name,
            age=age,
            email=email
        )

        session.add(new_employee)
        await session.commit()
        await session.refresh(new_employee)

        return api_response(200, "创建员工成功", {
            "id": new_employee.id,
            "name": new_employee.name,
            "age": new_employee.age,
            "email": new_employee.email
        })

@employees_bp.put('/<employee_id:int>')
@authorized()
@validate_json('name', 'age', 'email')
async def update_employee(request: Request, employee_id: int):
    """Update employee"""
    name = request.json['name']
    age = request.json['age']
    email = request.json['email']

    # Validation
    if not (1 <= len(name) <= 20):
        raise APIException(400, "参数校验失败: 姓名长度必须在1-20个字符之间")

    if not isinstance(age, int) or not (18 <= age <= 60):
        raise APIException(400, "参数校验失败: 年龄必须在18-60岁之间")

    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise APIException(400, "参数校验失败: 邮箱格式不正确")

    async for session in get_db():
        # Check if employee exists
        result = await session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()

        if not employee:
            raise APIException(404, "员工不存在")

        # Check if email already exists (excluding current employee)
        result = await session.execute(
            select(Employee).where(Employee.email == email, Employee.id != employee_id)
        )
        if result.scalar_one_or_none():
            raise APIException(400, "参数校验失败: 邮箱已存在")

        # Update employee
        employee.name = name
        employee.age = age
        employee.email = email

        await session.commit()

        return api_response(200, "更新员工成功", {
            "id": employee.id,
            "name": employee.name,
            "age": employee.age,
            "email": employee.email
        })

@employees_bp.delete('/<employee_id:int>')
@authorized()
async def delete_employee(request: Request, employee_id: int):
    """Delete employee"""
    async for session in get_db():
        result = await session.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalar_one_or_none()

        if not employee:
            raise APIException(404, "员工不存在")

        await session.delete(employee)
        await session.commit()

        return api_response(200, "删除员工成功")