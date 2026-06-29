import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login.component';
import { LayoutComponent } from './layout/layout.component';
import { authGuard } from './core/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { MembersComponent } from './pages/members/members.component';
import { FingerprintsComponent } from './pages/fingerprints/fingerprints.component';
import { MembershipsComponent } from './pages/memberships/memberships.component';
import { AttendanceComponent } from './pages/attendance/attendance.component';
import { DevicesComponent } from './pages/devices/devices.component';
import { AccessComponent } from './pages/access/access.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        component: DashboardComponent,
      },
      {
        path: 'members',
        component: MembersComponent,
      },
      {
        path: 'fingerprints',
        component: FingerprintsComponent,
      },
      {
        path: 'memberships',
        component: MembershipsComponent,
      },
      {
        path: 'attendance',
        component: AttendanceComponent,
      },
      {
        path: 'devices',
        component: DevicesComponent,
      },
      {
        path: 'access',
        component: AccessComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];