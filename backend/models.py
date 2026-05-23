from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default='admin')
    created_at = Column(DateTime, default=datetime.utcnow)

class Employee(Base):
    __tablename__ = 'employees'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(20), nullable=False)
    age = Column(Integer, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        CheckConstraint('age >= 18 AND age <= 60', name='check_age_range'),
    )

class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    devices = relationship("Device", back_populates="category", cascade="all, delete-orphan")

class Device(Base):
    __tablename__ = 'devices'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    model = Column(String(100))
    category_id = Column(Integer, ForeignKey('categories.id', ondelete='RESTRICT'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    category = relationship("Category", back_populates="devices")