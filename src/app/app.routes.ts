import { Routes } from '@angular/router';
import { DefaultLayout } from './layout/default-layout/default-layout';

export const routes: Routes = [{ path: '', component: DefaultLayout, children: [] }];
