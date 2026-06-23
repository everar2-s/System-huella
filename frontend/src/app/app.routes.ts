import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AccessComponent } from './features/access/access.component';
import { AttendanceComponent } from './features/attendance/attendance.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DevicesComponent } from './features/devices/devices.component';
import { LoginComponent } from './features/login/login.component';
import { MemberDetailComponent } from './features/members/member-detail/member-detail.component';
import { MemberFingerprintComponent } from './features/members/member-fingerprint/member-fingerprint.component';
import { MemberFormComponent } from './features/members/member-form/member-form.component';
import { MemberMembershipsComponent } from './features/members/member-memberships/member-memberships.component';
import { MembersListComponent } from './features/members/members-list/members-list.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members',
    component: MembersListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members/new',
    component: MemberFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members/:id',
    component: MemberDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members/:id/edit',
    component: MemberFormComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members/:id/fingerprint',
    component: MemberFingerprintComponent,
    canActivate: [authGuard],
  },
  {
    path: 'members/:id/memberships',
    component: MemberMembershipsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'attendance',
    component: AttendanceComponent,
    canActivate: [authGuard],
  },
  {
    path: 'devices',
    component: DevicesComponent,
    canActivate: [authGuard],
  },
  {
    path: 'access',
    component: AccessComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
