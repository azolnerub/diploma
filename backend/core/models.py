from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('hr', 'HR-специалист'),
        ('manager', 'Руководитель'),
        ('employee', 'Сотрудник'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')

class Department(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название отдела")

    def __str__(self):
        return self.name

class Position(models.Model):
    name = models.CharField(max_length=100, verbose_name="Название должности")
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

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

class IdealProfile(models.Model):
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    competency = models.ForeignKey(Competency, on_delete=models.CASCADE)
    required_level = models.IntegerField()
    weight = models.IntegerField(default=1)

class Reserve(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    position = models.ForeignKey(Position, on_delete=models.CASCADE)
    date_added = models.DateField(auto_now_add=True)
    priority = models.IntegerField(default=1)