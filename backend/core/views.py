from rest_framework import generics, status
from django.db.models import Count
from rest_framework.views import APIView
from django.contrib.auth.models import User
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import (Employee, Competency, Evaluation, Department, Position,
                     Category, Role, Reserve, RoleProfile, PositionProfile)
from .serializers import (EmployeeSerializer, CompetencySerializer, EvaluationSerializer,
                          DeptSerializer, PosSerializer, CategorySerializer,
                          RoleSerializer, RoleProfileSerializer, PositionProfileSerializer)

User = get_user_model()

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        employee = None
        try:
            employee = user.employee
        except AttributeError:
            pass

        data = {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "full_name": employee.full_name if employee else user.username,
            "position": employee.position.name if employee and employee.position else None,
            "department": employee.department.name if employee and employee.department else None,
        }
        return Response(data)

class EmployeeListView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.select_related('position', 'department').all()
        user = self.request.user

        if user.role == 'employee':
            queryset = queryset.filter(user=user)
        elif user.role == 'manager' and hasattr(user, 'employee'):
            queryset = queryset.filter(department=user.employee.department)

        return queryset

# Создание сотрудника
class EmployeeCreateView(generics.CreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        try:
            username = request.data.get('username')
            password = request.data.get('password')
            system_role = request.data.get('system_role', 'employee')

            if not username or not password:
                return Response({"detail": "Логин и пароль обязательны"}, status=400)

            if system_role not in ['employee', 'hr', 'manager']:
                system_role = 'employee'

            # 1. Создаем пользователя
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'role': system_role, 'is_active': True}
            )

            if created:
                user.set_password(password)
                user.save()

            # 2. Создаем сотрудника
            employee = Employee.objects.create(
                user=user,
                full_name=request.data.get('full_name'),
                position_id=request.data.get('position_id'),
                department_id=request.data.get('department_id'),
                hire_date=request.data.get('hire_date'),
                status=request.data.get('status', 'Работает'),
            )

            if employee.position:
                employee.competencies.set(employee.position.competencies.all())

            extra_comp_ids = request.data.get('competency_ids', [])
            if isinstance(extra_comp_ids, list) and extra_comp_ids:
                employee.competencies.add(*extra_comp_ids)

            serializer = self.get_serializer(employee)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print("Ошибка создания сотрудника:", str(e))
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Редактирование сотрудника
class EmployeeUpdateView(generics.UpdateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()

        new_role = self.request.data.get('system_role')
        if new_role in ['employee', 'hr', 'manager']:
            user = instance.user
            user.role = new_role
            user.save()

        # Обновляем список компетенций, если он передан в запросе
        comp_ids = self.request.data.get('competency_ids')
        if comp_ids is not None:
            if isinstance(comp_ids, list):
                instance.competencies.set(comp_ids)
            else:
                instance.competencies.set([])

# Удаление сотрудника
class EmployeeDeleteView(generics.DestroyAPIView):
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        if user:
            user.delete()

# Страница редактирования сотрудника
class EmployeeDetailView(generics.RetrieveAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

# Отделы
class DepartmentListView(generics.ListAPIView):
    queryset = Department.objects.all()
    serializer_class = DeptSerializer
    permission_classes = [IsAuthenticated]

# Должности
class PositionListView(generics.ListAPIView):
    queryset = Position.objects.all()
    serializer_class = PosSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Position.objects.annotate(candidate_count=Count('reserve'))

# Компетенции
class CompetencyListView(generics.ListCreateAPIView):
    queryset = Competency.objects.all()
    serializer_class = CompetencySerializer
    permission_classes = [IsAuthenticated]

# Категории
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

# Оценки сотрудников
class EmployeeEvaluationListView(generics.ListAPIView):
    serializer_class = EvaluationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'employee_id'

    def get_queryset(self):
        employee_id = self.kwargs['employee_id']
        return Evaluation.objects.filter(employee_id=employee_id)

# Добавление компетенции в профиль сотрудника
class AddCompetencyToProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, employee_id):
        employee = get_object_or_404(Employee, id=employee_id)
        competency_id = request.data.get('competency_id')
        competency = get_object_or_404(Competency, id=competency_id)

        if Evaluation.objects.filter(employee=employee,competency=competency).exists():
            return Response({"message": "Компетенция уже добавлена"}, status=400)

        Evaluation.objects.create(
            employee=employee,
            competency=competency,
            value=0,
            comment="Компетенция добавлена HR",
            manager=request.user
        )
        return Response({"message": "Компетенция добавлена в профиль"}, status=201)

class AddCompetencyToEmployeeView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, employee_id):
        employee = get_object_or_404(Employee, id=employee_id)
        competency_id = request.data.get('competency_id')
        value = request.data.get('value', 3)
        comment = request.data.get('comment', '')

        competency = get_object_or_404(Competency, id=competency_id)

        evaluation = Evaluation.objects.create(
            employee=employee,
            competency=competency,
            value=value,
            comment=comment,
            manager=request.user
        )

        return Response({"message": "Компетенция добавлена", "evaluation_id": evaluation.id}, status=status.HTTP_201_CREATED)

# Удаление компетенции из профиля сотрудника
class RemoveCompetencyFromEmployeeView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id, competency_id):
        deleted = Evaluation.objects.filter(employee_id=employee_id, competency_id=competency_id).delete()
        if deleted[0] > 0:
            return Response({"message": "Компетенция удалена"}, status=status.HTTP_204_NO_CONTENT)
        return Response({"message": "Компетенция не найдена"}, status=status.HTTP_404_NOT_FOUND)

class PositionCompetenciesView(generics.ListAPIView):
    serializer_class = CompetencySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        position_id = self.kwargs['pk']
        position = get_object_or_404(Position, pk=position_id)
        return position.competencies.all()

class PositionCompetenciesUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        position = get_object_or_404(Position, pk=pk)
        competency_ids = request.data.get('competency_ids', [])

        if not isinstance(competency_ids, list):
            return Response({"detail": "competency_ids должен быть списком"}, status=400)

        position.competencies.set(competency_ids)

        return Response({
            "message": "Компетенции должности успешно обновлены",
            "position": position.name,
            "competency_count": len(competency_ids)
        }, status=200)

def calculate_dynamics_score(employee):
    evaluations = Evaluation.objects.filter(employee=employee) \
        .order_by('date', 'competency_id')

    if evaluations.count() < 2:
        return 0.0

    from collections import defaultdict
    comp_history = defaultdict(list)

    for ev in evaluations:
        comp_history[ev.competency_id].append(ev.value)

    total_score = 0.0
    comp_count = 0

    for values in comp_history.values():
        if len(values) < 2:
            continue

        changes = [values[i] - values[i - 1] for i in range(1, len(values))]

        # Более чувствительные веса: последние изменения имеют значительно больший вес
        n = len(changes)
        if n == 1:
            weights = [1.0]
        else:
            # Последнее изменение — самый большой вес
            weights = [0.1 * (i + 1) for i in range(n)]
            weight_sum = sum(weights)
            weights = [w / weight_sum for w in weights]

        weighted_change = sum(c * w for c, w in zip(changes, weights))

        total_score += weighted_change
        comp_count += 1

    final_score = total_score / comp_count if comp_count > 0 else 0.0

    # Округляем до одного знака после запятой
    return round(final_score, 1)

class EmployeeDynamicsView(generics.ListAPIView):
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Employee.objects.select_related('position', 'department').prefetch_related('competencies')

        user = self.request.user

        if user.role == 'employee':
            queryset = queryset.filter(user=user)
        elif user.role == 'manager' and hasattr(user, 'employee'):
            queryset = queryset.filter(department=user.employee.department)

        return queryset

# === РАСЧЁТ СООТВЕТСТВИЯ СОТРУДНИКА ЦЕЛЕВОЙ ДОЛЖНОСТИ ===
def calculate_position_match(employee, position_id, role_id=None):
    """Расчёт соответствия сотрудника должности"""
    try:
        position = Position.objects.get(pk=position_id)
    except Position.DoesNotExist:
        return {"match_index": 0, "breakdown": [], "error": "Должность не найдена"}

    evaluations = {e.competency_id: e.value for e in Evaluation.objects.filter(employee=employee)}

    requirements = []

    # 1. Приоритет — PositionProfile (то, что задал HR)
    for pp in PositionProfile.objects.filter(position=position).select_related('competency'):
        requirements.append({
            'competency_id': pp.competency_id,
            'required_level': pp.required_level,
            'weight': pp.weight,
            'is_key': pp.is_key,
            'source': 'position'
        })

    # 2. Если PositionProfile пустой — агрегируем из всех ролей (MAX уровень)
    if not requirements:
        competency_map = {}  # competency_id → max required_level, max weight, is_key

        for role in position.roles.all():
            for rp in role.profile.all().select_related('competency'):
                cid = rp.competency_id
                if cid not in competency_map:
                    competency_map[cid] = {
                        'required_level': rp.required_level,
                        'weight': rp.weight,
                        'is_key': rp.is_key,
                        'source': 'role'
                    }
                else:
                    # MAX по уровню
                    competency_map[cid]['required_level'] = max(
                        competency_map[cid]['required_level'],
                        rp.required_level
                    )
                    # Можно взять средний вес или максимальный — здесь средний
                    competency_map[cid]['weight'] = (competency_map[cid]['weight'] + rp.weight) / 2

        for cid, data in competency_map.items():
            requirements.append({
                'competency_id': cid,
                'required_level': data['required_level'],
                'weight': data['weight'],
                'is_key': data['is_key'],
                'source': 'role'
            })

    # Расчёт индекса
    total_weight = 0.0
    weighted_score = 0.0
    breakdown = []

    for req in requirements:
        current = evaluations.get(req['competency_id'], 0)
        ratio = min(1.0, current / req['required_level']) if req['required_level'] > 0 else 0
        score_contrib = ratio * req['weight']

        total_weight += req['weight']
        weighted_score += score_contrib

        breakdown.append({
            'competency_name': Competency.objects.get(id=req['competency_id']).name,
            'current': current,
            'required': req['required_level'],
            'weight': round(req['weight'], 3),
            'ratio': round(ratio * 100, 1),
            'is_key': req['is_key'],
            'is_missing': current == 0,
            'source': req['source']
        })

    match_index = round((weighted_score / total_weight * 100), 1) if total_weight > 0 else 0

    return {
        "match_index": match_index,
        "coverage": round(len([b for b in breakdown if not b['is_missing']]) / len(breakdown) * 100, 1) if breakdown else 0,
        "breakdown": sorted(breakdown, key=lambda x: (x.get('is_key', False), x['ratio']), reverse=True),
        "total_weight": round(total_weight, 3)
    }

def calculate_role_match(employee, role_id):
    """Расчёт соответствия роли + всех должностей внутри роли"""
    role = get_object_or_404(Role, pk=role_id)
    profile_items = RoleProfile.objects.filter(role=role).select_related('competency')

    total_weight = 0.0
    weighted_sum = 0.0
    evaluated_count = 0
    total_competencies = profile_items.count()

    evals = {e.competency_id: e.value for e in Evaluation.objects.filter(employee=employee)}
    breakdown = []
    gaps = []

    for item in profile_items:
        req = item.required_level
        w = float(item.weight)
        total_weight += w

        current = evals.get(item.competency_id, 0)
        ratio = min(1.0, current / req) if req > 0 else 0.0
        weighted_sum += ratio * w

        if current > 0:
            evaluated_count += 1

        breakdown.append({
            'competency_name': item.competency.name,
            'current': current,
            'required': req,
            'weight': round(w, 2),
            'ratio': round(ratio * 100, 1),
            'is_missing': current == 0,
            'is_key': item.is_key
        })

        if ratio < 0.7:
            gaps.append({
                'competency_name': item.competency.name,
                'gap': req - current,
                'is_key': item.is_key
            })

    match_index = (weighted_sum / total_weight * 100) if total_weight > 0 else 0.0
    coverage = (evaluated_count / total_competencies * 100) if total_competencies > 0 else 0.0

    recommendations = sorted(gaps, key=lambda x: (x['is_key'], x['gap']), reverse=True)[:4]

    # Должности внутри роли
    positions_data = []
    for position in role.positions.all():
        pos_match = calculate_position_match(employee, position.id, role_id)
        positions_data.append({
            'position_id': position.id,
            'position_name': position.name,
            'match_index': pos_match.get('match_index', 0)
        })

    return {
        'role_name': role.name,
        'role_match_index': round(match_index, 1),
        'coverage': round(coverage, 1),
        'breakdown': breakdown,
        'recommendations': recommendations,
        'key_failures': len([g for g in gaps if g['is_key']]),
        'positions': positions_data
    }

# === РОЛИ ===
class RoleListCreateView(generics.ListCreateAPIView):
    queryset = Role.objects.prefetch_related('positions').select_related('department').all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated]

class RoleProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        profiles = RoleProfile.objects.filter(role=role).select_related('competency', 'competency__category')
        serializer = RoleProfileSerializer(profiles, many=True)

        return Response({
            "role_id": role.id,
            "role_name": role.name,
            "role_description": role.description,
            "profiles": serializer.data
        })

class RoleMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id, role_id):
        employee = get_object_or_404(Employee, pk=employee_id)
        data = calculate_role_match(employee, role_id)
        return Response(data)

class RolePositionMatchView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id, role_id, position_id):
        employee = get_object_or_404(Employee, pk=employee_id)
        data = calculate_position_match(employee, position_id, role_id)
        return Response(data)

class PositionCompetenciesFromRolesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, position_id):
        position = get_object_or_404(Position, pk=position_id)

        competencies = []

        # Компетенции напрямую из должности
        for comp in position.competencies.all():
            competencies.append({
                'id': comp.id,
                'name': comp.name,
                'description': comp.description or '',
                'required_level': None
            })

        # Компетенции из всех ролей этой должности
        for role in position.roles.all():
            for rp in role.profile.all().select_related('competency'):
                competencies.append({
                    'id': rp.competency.id,
                    'name': rp.competency.name,
                    'description': rp.competency.description or '',
                    'required_level': rp.required_level,
                })

        # Убираем дубликаты
        unique = {c['id']: c for c in competencies}
        return Response(list(unique.values()))

class PositionProfileListCreateView(generics.ListCreateAPIView):
    serializer_class = PositionProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        position_id = self.kwargs.get('position_id')
        if position_id:
            return PositionProfile.objects.filter(position_id=position_id)
        return PositionProfile.objects.all()

    def perform_create(self, serializer):
        position_id = self.kwargs.get('position_id')
        serializer.save(position_id=position_id)

class PositionProfileUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    queryset = PositionProfile.objects.all()
    serializer_class = PositionProfileSerializer
    permission_classes = [IsAuthenticated]

class AddToReserveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, employee_id):
        employee = get_object_or_404(Employee, pk=employee_id)
        position_id = request.data.get('position_id')

        if not position_id:
            return Response({"detail": "Не указана целевая должность"}, status=400)

        position = get_object_or_404(Position, pk=position_id)

        if Reserve.objects.filter(employee=employee).exists():
            return Response({"detail": "Сотрудник уже в кадровом резерве"}, status=400)

        Reserve.objects.create(
            employee=employee,
            position=position,
            priority=1
        )

        return Response({"message": "Сотрудник добавлен в кадровый резерв"}, status=201)

class RemoveFromReserveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id):
        deleted = Reserve.objects.filter(employee_id=employee_id).delete()
        if deleted[0] > 0:
            return Response({"message": "Сотрудник удалён из кадрового резерва"}, status=204)
        return Response({"detail": "Сотрудник не найден в резерве"}, status=404)

class PositionCandidatesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, position_id):
        position = get_object_or_404(Position, pk=position_id)

        reserves = Reserve.objects.filter(
            position=position
        ).select_related(
            'employee',
            'employee__position',
            'employee__department'
        ).order_by('-priority', '-date_added')

        candidates = []
        for r in reserves:
            emp = r.employee

            # ← ИСПРАВЛЕНИЕ: передаём position.id, а не объект position
            match_data = calculate_position_match(emp, position.id)

            candidates.append({
                "employee_id": emp.id,
                "full_name": emp.full_name,
                "current_position_name": emp.position.name if emp.position else "—",
                "department_name": emp.department.name if emp.department else "—",
                "match_index": match_data.get('match_index', 0),
                "dynamics_score": getattr(emp, 'dynamics_score', 0),
                "priority": r.priority,
                "target_position_name": position.name,
            })

        return Response({
            "position_id": position.id,
            "position_name": position.name,
            "department_name": position.department.name if position.department else "—",
            "candidate_count": len(candidates),
            "candidates": candidates
        })
