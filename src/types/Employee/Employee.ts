// src/types/Employee/Employee.ts
//
// Shape of an item returned by GET /api/v1/employees?empId=<id> (raw uppercase keys).

export interface Employee {
  EMPID:       number;
  EMPNAME:     string;
  DATEOFJOIN?: string;
  ADDRESS1?:   string;
  ADDRESS2?:   string;
  ADDRESS3?:   string;
  ADDRESS4?:   string;
  ACTIVE:      string;
  USERID?:     number;
  UPDATETIME?: string | null;
  COSTID?:     string;
  PREVILEGEID?: string;
  EMPGRPID?:   number | null;
  CENTEMP?:    number | null;
}
