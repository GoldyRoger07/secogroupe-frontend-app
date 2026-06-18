import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Employee, EmployeeRequest } from '../models/employee.models';
import { PageRequest, PageResponse } from '../models/page.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/employees`;

  getAll(params: PageRequest): Observable<PageResponse<Employee>> {
    return this.http.get<PageResponse<Employee>>(this.baseUrl, { params: this.toParams(params) });
  }

  create(request: EmployeeRequest, photo?: File): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, this.buildForm(request, photo));
  }

  update(id: number, request: EmployeeRequest, photo?: File): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, this.buildForm(request, photo));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private buildForm(request: EmployeeRequest, photo?: File): FormData {
    const fd = new FormData();
    fd.append('data', JSON.stringify(request));
    if (photo) fd.append('photo', photo);
    return fd;
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
