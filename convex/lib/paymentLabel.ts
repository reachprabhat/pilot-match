// Display metadata only. Access, grandfathering and QR rules remain separate.
export function paymentLabel(access:{free:boolean;paidAt?:number}|null,firstConnect=false){
  if(access?.paidAt!==undefined){
    const date=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:false}).format(access.paidAt);
    return `Paid, marked ${date} IST`;
  }
  return access?.free||firstConnect?"Free (first connect)":"Payment pending";
}
