import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role, RoleRequest } from '../models/role.models';
import { PageRequest, PageResponse } from '../models/page.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/roles`;

  getAll(params: PageRequest): Observable<PageResponse<Role>> {
    return this.http.get<PageResponse<Role>>(this.baseUrl, { params: this.toParams(params) });
  }

  getList(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.baseUrl}/list`);
  }

  create(request: RoleRequest): Observable<Role> {
    return this.http.post<Role>(this.baseUrl, request);
  }

  update(id: number, request: RoleRequest): Observable<Role> {
    return this.http.put<Role>(`${this.baseUrl}/${id}`, request);
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
