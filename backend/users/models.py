from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', 'Сотрудник'),
        ('manager', 'Руководитель'),
        ('hr', 'HR-специалист'),
    )

    role = models.CharField('Роль', max_length=20, choices=ROLE_CHOICES, default='employee')
    patronymic = models.CharField('ФИО', max_length=100, blank=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)

    class Meta:
        verbose_name = 'Пользователь',
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return f"{self.last_name} {self.first_name}"

