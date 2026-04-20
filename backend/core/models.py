from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('hr', 'HR-специалист'),
        ('manager', 'Руководитель'),
        ('employee', 'Сотрудник'),
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='employee')

class Department(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название отдела")

    def __str__(self):
        return self.name

class Position(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название должности")
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    roles = models.ManyToManyField('Role', blank=True, related_name='position_set')
    competencies = models.ManyToManyField('Competency', blank=True, related_name='positions')

    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название категории")

    def __str__(self):
        return self.name

class Competency(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class Employee(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    full_name = models.CharField(max_length=200)
    position = models.ForeignKey(Position, on_delete=models.SET_NULL, null=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    hire_date = models.DateField()
    status = models.CharField(max_length=50, default="Активен")
    competencies = models.ManyToManyField('Competency', blank=True, related_name='employees')

    def __str__(self):
        return self.full_name

class Evaluation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE)
    value = models.IntegerField(choices=[(i, i) for i in range(0, 101)])
    date = models.DateField(auto_now_add=True)
    comment = models.TextField(blank=True)
    manager = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='evaluations_given')

    class Meta:
        ordering = ['-date']

class Reserve(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    target_role = models.ForeignKey('Role', on_delete=models.SET_NULL, null=True, blank=True)
    date_added = models.DateField(auto_now_add=True)
    priority = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.employee} → {self.position}"

class Role(models.Model):
    name = models.CharField(max_length=150, verbose_name="Название роли")
    description = models.TextField(blank=True, verbose_name="Описание роли")
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name='roles', null=True, blank=True)
    default_missing_level = models.PositiveIntegerField(default=20, verbose_name="Уровень по умолчанию при отсутствии оценки (0-100)")
    positions = models.ManyToManyField('Position', blank=True, related_name='role_set')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Роль"
        verbose_name_plural = "Роли"

class RoleProfile(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='profile')
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE)
    required_level = models.PositiveIntegerField(default=60, verbose_name="Требуемый уровень (0-100)")
    weight = models.FloatField(default=0.15, verbose_name="Вес (сумма по роли ≈ 1.0)")
    is_key = models.BooleanField(default=False, verbose_name="Обязательная компетенция")

    class Meta:
        unique_together = ('role', 'competency')
        verbose_name = "Профиль роли"
        verbose_name_plural = "Профили ролей"

    def __str__(self):
        return f"{self.role.name} → {self.competency.name} ({'Ключевая' if self.is_key else 'Обычная'})"

class PositionProfile(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE, related_name='profile', verbose_name="Должность")
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE, verbose_name="Компетенция")
    required_level = models.PositiveIntegerField(default=60, verbose_name="Требуемый уровень (0-100)")
    weight = models.FloatField(default=0.15, verbose_name="Вес")
    is_key = models.BooleanField(default=False, verbose_name="Ключевая компетенция")

    class Meta:
        unique_together = ('position', 'competency')
        verbose_name = "Профиль должности"
        verbose_name_plural = "Профили должностей"
        ordering = ['position', '-is_key', 'weight']

    def __str__(self):
        return f"{self.position.name} → {self.competency.name} ({self.required_level}%)"
