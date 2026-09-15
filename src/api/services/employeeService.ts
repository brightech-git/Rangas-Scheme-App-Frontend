// src/api/services/employeeService.ts

import { callApi } from '../apiClient';
import { EMPLOYEES } from '../endpoints';
import { Employee } from '../../types/Employee/Employee';

export const employeeService = {
  /** GET /api/v1/employees?empId=<id> — search employees by (partial) Emp ID */
  search: (empId: string) =>
    callApi<null, Employee[]>({
      method: 'get',
      url:    EMPLOYEES.SEARCH(empId),
    }),
};
