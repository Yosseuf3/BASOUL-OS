/** Version only task INSERTs; never add application headers to Auth/Storage/Edge CORS requests. */
export function withTaskCreationContract(transport: typeof fetch): typeof fetch {
  return (input, init) => {
    const method=init?.method ?? (typeof input==='object' && 'method' in input ? input.method : 'GET');
    const address=typeof input==='string' ? input : input instanceof URL ? input.href : input.url;
    if(method.toUpperCase()!=='POST'||!new URL(address).pathname.endsWith('/rest/v1/tasks'))return transport(input,init);
    const headers=new Headers(init?.headers ?? (typeof input==='object' && 'headers' in input ? input.headers : undefined));
    headers.set('x-basoul-task-create-contract','atomic-source-v1');
    return transport(input,{...init,headers});
  };
}
