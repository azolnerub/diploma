from django.urls import path
from .views import (CurrentUserView, EmployeeListView, EmployeeCreateView, EmployeeUpdateView,
                    EmployeeDeleteView, EmployeeDetailView, AddCompetencyToEmployeeView,
                    RemoveCompetencyFromEmployeeView, IdealProfileListCreateView,
                    IdealProfileUpdateDeleteView, DepartmentListView, PositionListView,
                    CompetencyListView, EmployeeEvaluationListView)

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('employees/', EmployeeListView.as_view(), name='employee_list'),
    path('employees/create/', EmployeeCreateView.as_view(), name='employee_create'),
    path('employees/<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee_update'),
    path('employees/<int:pk>/delete/', EmployeeDeleteView.as_view(), name='employee_delete'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),

    path('employees/<int:employee_id>/competencies/add/', AddCompetencyToEmployeeView.as_view()),
    path('employees/<int:employee_id>/competencies/<int:competency_id>/remove/', RemoveCompetencyFromEmployeeView.as_view()),

    path('departments/', DepartmentListView.as_view(), name='department_list'),
    path('positions/', PositionListView.as_view(), name='position_list'),

    path('competencies/', CompetencyListView.as_view(), name='competency_list'),
    path('employees/<int:employee_id>/evaluations/', EmployeeEvaluationListView.as_view(), name='employee_evaluations'),

    path('ideal-profiles/', IdealProfileListCreateView.as_view()),
    path('ideal-profiles/<int:pk>/', IdealProfileUpdateDeleteView.as_view())
]