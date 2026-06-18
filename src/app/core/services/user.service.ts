import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRequest } from '../models/user.models';
import { PageRequest, PageResponse } from '../models/page.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/users`;

  getAll(params: PageRequest): Observable<PageResponse<User>> {
    return this.http.get<PageResponse<User>>(this.baseUrl, { params: this.toParams(params) });
  }

  create(request: UserRequest): Observable<User> {
    return this.http.post<User>(this.baseUrl, request);
  }

  update(id: number, request: UserRequest): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${id}`, request);
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
