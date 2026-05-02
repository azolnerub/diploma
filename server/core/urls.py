from django.urls import path
from .views import (CurrentUserView, EmployeeListView, EmployeeCreateView, EmployeeUpdateView,
                    EmployeeDeleteView, EmployeeDetailView, AddCompetencyToEmployeeView,
                    RemoveCompetencyFromEmployeeView, DepartmentListView, PositionListView,
                    CompetencyListView, EmployeeEvaluationListView, AddCompetencyToProfileView,
                    CategoryListView, PositionCompetenciesView, PositionCompetenciesUpdateView,
                    EmployeeDynamicsView, RoleListCreateView, RolePositionMatchView,
                    RoleProfileView, RoleMatchView, PositionCompetenciesFromRolesView,
                    PositionProfileListCreateView, PositionProfileUpdateDeleteView,
                    AddToReserveView, RemoveFromReserveView, PositionCandidatesView,
                    PositionRolesView, RoleDetailView, UserFullProfileView,
                    ChangePasswordView)

urlpatterns = [
    path('me/', CurrentUserView.as_view(), name='current_user'),
    path('employees/', EmployeeListView.as_view(), name='employee_list'),
    path('employees/me/profile_full/', UserFullProfileView.as_view()),
    path('employees/create/', EmployeeCreateView.as_view(), name='employee_create'),
    path('employees/<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee_update'),
    path('employees/<int:pk>/delete/', EmployeeDeleteView.as_view(), name='employee_delete'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee_detail'),

    path('employees/<int:employee_id>/competencies/add-simple/', AddCompetencyToProfileView.as_view()),
    path('employees/<int:employee_id>/competencies/add/', AddCompetencyToEmployeeView.as_view()),
    path('employees/<int:employee_id>/competencies/<int:competency_id>/remove/', RemoveCompetencyFromEmployeeView.as_view()),

    path('departments/', DepartmentListView.as_view(), name='department_list'),

    path('positions/', PositionListView.as_view(), name='position_list'),
    path('positions/<int:pk>/competencies/', PositionCompetenciesView.as_view(), name='position_competencies'),
    path('positions/<int:pk>/competencies/update/', PositionCompetenciesUpdateView.as_view(), name='position_competencies_update'),
    path('positions/<int:position_id>/competencies-from-roles/', PositionCompetenciesFromRolesView.as_view(), name='position_competencies_from_roles'),
    path('positions/<int:position_id>/profile/', PositionProfileListCreateView.as_view(), name='position_profile_list'),
    path('positions/<int:position_id>/profile/<int:pk>/', PositionProfileUpdateDeleteView.as_view(), name='position_profile_detail'),
    path('positions/<int:position_id>/candidates/', PositionCandidatesView.as_view(), name='position_candidates'),
    path('positions/<int:position_id>/roles/', PositionRolesView.as_view(), name='position_roles'),

    path('employees/<int:employee_id>/reserve/add/', AddToReserveView.as_view(), name='add_to_reserve'),
    path('employees/<int:employee_id>/reserve/remove/', RemoveFromReserveView.as_view(), name='remove_from_reserve'),

    path('employees/dynamics/', EmployeeDynamicsView.as_view(), name='employee_dynamics'),

    path('competencies/', CompetencyListView.as_view(), name='competency_list'),
    path('categories/', CategoryListView.as_view(), name='category_list'),
    path('employees/<int:employee_id>/evaluations/', EmployeeEvaluationListView.as_view(), name='employee_evaluations'),

    path('roles/', RoleListCreateView.as_view(), name='role_list'),
    path('roles/<int:role_id>/profile/', RoleProfileView.as_view(), name='role_profile'),
    path('roles/<int:pk>/', RoleDetailView.as_view(), name='role_detail'),

    path('employees/<int:employee_id>/match/role/<int:role_id>/', RoleMatchView.as_view(), name='role_match'),
    path('employees/<int:employee_id>/match/role/<int:role_id>/position/<int:position_id>/', RolePositionMatchView.as_view(), name='role_position_match'),

    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
]
