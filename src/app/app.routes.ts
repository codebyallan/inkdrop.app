import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout';
import { Location } from './features/location/location';
import { Printer } from './features/printer/printer';
import { Toner } from './features/toner/toner';
import { Movement } from './features/movement/movement';

export const routes: Routes = [{
    path: '', component: DefaultLayout, children: [
        { path: 'locations', component: Location },
        { path: 'printers', component: Printer },
        { path: 'toners', component: Toner },
        { path: 'movements', component: Movement }
    ]
}];
