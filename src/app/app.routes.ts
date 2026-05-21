import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout';
import { Dashboard } from './features/dashboard/dashboard';
import { Location } from './features/location/location';
import { Printer } from './features/printer/printer';
import { Toner } from './features/toner/toner';
import { Movement } from './features/movement/movement';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login', 
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
        canActivate: [guestGuard]
    },
    {
        path: '', 
        component: DefaultLayout, 
        canActivate: [authGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            { path: 'dashboard', component: Dashboard },
            { path: 'locations', component: Location },
            { path: 'printers', component: Printer },
            { path: 'toners', component: Toner },
            { path: 'movements', component: Movement }
        ]
    },
    { path: '**', redirectTo: '' }
];
