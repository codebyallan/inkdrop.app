import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout';
import { Dashboard } from './features/dashboard/dashboard.component';
import { Location } from './features/location/location.component';
import { Printer } from './features/printer/printer.component';
import { Toner } from './features/toner/toner.component';
import { Movement } from './features/movement/movement.component';
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
            { path: 'dashboard', component: Dashboard },
            { path: 'locations', component: Location },
            { path: 'printers', component: Printer },
            { path: 'toners', component: Toner },
            { path: 'movements', component: Movement },
            { 
              path: 'users', 
              loadComponent: () => import('./features/user/user.component').then(m => m.User), 
              canActivate: [adminGuard] 
            }
        ]
    },
    { path: '**', redirectTo: '' }
];
