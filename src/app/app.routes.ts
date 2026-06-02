import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout.component';
import { authGuard, guestGuard, verifiedAuthGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: 'login', 
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
    },
    {
        path: '', 
        component: DefaultLayout, 
        canActivate: [verifiedAuthGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            { 
              path: 'dashboard', 
              loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.Dashboard) 
            },
            { 
              path: 'locations', 
              loadComponent: () => import('./features/location/location.component').then(m => m.Location) 
            },
            { 
              path: 'printers', 
              loadComponent: () => import('./features/printer/printer.component').then(m => m.Printer) 
            },
            { 
              path: 'toners', 
              loadComponent: () => import('./features/toner/toner.component').then(m => m.Toner) 
            },
            { 
              path: 'movements', 
              loadComponent: () => import('./features/movement/movement.component').then(m => m.Movement) 
            },
            { 
              path: 'settings', 
              loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) 
            },
            { 
              path: 'users', 
              loadComponent: () => import('./features/user/user.component').then(m => m.User), 
              canActivate: [adminGuard] 
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
