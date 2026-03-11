from django.db import models
from users.models import User

class Department(models.Model):
    name = models.CharField('Название отдела', max_length=100)

    class Meta:
        verbose_name = 'Отдел'
        verbose_name_plural = 'Отделы'
    def __str__(self):
        return self.name

class Position(models.Model):
    name = models.CharField('Название должности', max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, verbose_name='Отдел')

    class Meta:
        verbose_name = 'Должность'
        verbose_name_plural = 'Должности'

    def __str__(self):
        return f"{self.name} ({self.department})"

class Employee(models.Model):
    STATUS_CHOICES = (
        ('active', 'Работает'),
        ('inactive', 'Уволен'),
        ('vacation', 'В отпуске'),
        ('sick', 'На больничном'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, verbose_name='Пользователь')
    position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True, verbose_name='Должность')
    hire_date = models.CharField('Дата приема на работу')
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='active')

    class Meta:
        verbose_name = 'Сотрудник'
        verbose_name_plural = 'Сотрудники'

    def __str__(self):
        return f"{self.user.last_name} {self.user.first_name} - {self.position}"