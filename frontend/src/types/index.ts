export type Role='REQUESTER'|'DEPARTMENT_HEAD'|'DIRECTOR'|'CHAIRMAN'|'ACCOUNTANT'|'ADMIN';
export interface User{id:string;name:string;email:string;role:Role;departmentId?:string}
export interface Item{_id?:string;itemType:string;name:string;description?:string;quantity:number;unitPrice:number;amount?:number;supplier?:string}
export interface FinancialRequest{id:string;requestCode:string;requesterId:User;departmentId?:{name:string;code:string};type:'ADVANCE'|'PAYMENT';purpose:string;items:Item[];totalAmount:number;status:string;approvalLevel?:string;paymentStatus?:string;bankAccountNumber?:string;bankName?:string;chairmanPaymentApprovedAt?:string;createdAt:string}
export interface Action{_id:string;actorId:User;action:string;fromStatus:string;toStatus:string;comment?:string;createdAt:string}
