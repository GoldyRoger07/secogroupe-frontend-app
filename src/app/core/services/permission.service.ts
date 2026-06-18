import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Permission, PermissionRequest } from '../models/permission.models';
import { PageRequest, PageResponse } from '../models/page.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/permissions`;

  getAll(params: PageRequest): Observable<PageResponse<Permission>> {
    return this.http.get<PageResponse<Permission>>(this.baseUrl, { params: this.toParams(params) });
  }

  getList(): Observable<Permission[]> {
    return this.http.get<Permission[]>(`${this.baseUrl}/list`);
  }

  create(request: PermissionRequest): Observable<Permission> {
    return this.http.post<Permission>(this.baseUrl, request);
  }

  update(id: number, request: PermissionRequest): Observable<Permission> {
    return this.http.put<Permission>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toParams(p: PageRequest): HttpParams {
    return new HttpParams()
      .set('page', p.page)
      .set('size', p.size)
      .set('sortField', p.sortField ?? '')
      .set('sortOrder', p.sortOrder ?? 'asc')
      .set('globalFilter', p.globalFilter ?? '');
  }
}
