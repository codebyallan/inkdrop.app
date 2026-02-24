import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout';
import { Location } from './features/location/location';

export const routes: Routes = [{
    path: '', component: DefaultLayout, children: [
        { path: 'locations', component: Location }
    ]
}];
