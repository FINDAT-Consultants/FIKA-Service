(()=>{
'use strict';
const api=window.supabase?.createClient('https://gmiqvpemuabjueyprwyl.supabase.co','sb_publishable_1bOP6RQg-Wd2k51Q3LB1Pg_LsWjdErW');
const root=document.getElementById('root'), $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const name='fikova-', bucket='fikova-product-images';let user=null,company=null,admin=false,contact={},page='market',formMode='register',mode='business',companies=[],products=[],bills=[],notices=[];
const db=(table)=>api.from('fikova_'+table), fileUrl=path=>path?api.storage.from(bucket).getPublicUrl(path).data.publicUrl:'';
const money=(v,c)=>esc(c||'ZMW')+' '+Number(v||0).toFixed(2),time=v=>v?new Date(v).toLocaleString():'—';
const badge=s=>'<span class="badge '+esc(s)+'">'+esc((s||'pending').toUpperCase())+'</span>';
const alertBox=(s)=>'<div class="notice error">'+esc(s)+'</div>';
const catchErr=(id,e)=>{if($(id))$(id).innerHTML=alertBox(e.message||e);};
const toast=s=>{let e=$('toast');e.textContent=s;e.classList.remove('hidden');clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.add('hidden'),4500);};
async function one(query){const {data,error}=await query;if(error)throw error;return data;}
function heading(a,b){return '<h1 class="workspace-title">'+esc(a)+'</h1><p class="subtitle">'+esc(b)+'</p>';}
function nav(active,title,sub,content){
const links=admin?[['management','Companies directory'],['catalogue','Product catalogue'],['notices','Notices & payments'],['contacts','Contact settings'],['audit','Audit trail'],['market','Marketplace']]:[['owner','My business'],['products','My products'],['inbox','Account messages'],['market','Marketplace']];
root.innerHTML='<div class="layout"><aside class="sidebar"><div class="side-head"><b>FIKova Control</b><span>'+ (admin?'Management · Developer controls':'Business workspace')+'</span></div><div class="nav-set">'+links.map(x=>'<button class="nav-btn '+(active===x[0]?'active':'')+'" data-nav="'+x[0]+'">'+x[1]+'</button>').join('')+'</div></aside><section class="workspace">'+heading(title,sub)+content+'</section></div>';
root.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{page=b.dataset.nav;render();});}
const contactBlock=()=>'<p class="muted">'+esc(contact?.payment_help||'Contact FIKova Management for verified bank or mobile-money payment instructions.')+'</p><div class="btn-row">'+(contact.whatsapp?'<a class="primary" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/'+esc(String(contact.whatsapp).replace(/\D/g,''))+'">WhatsApp FIKova</a>':'')+(contact.email?'<a class="ghost" href="mailto:'+esc(contact.email)+'">Email FIKova</a>':'')+'</div>';
async function identity(){
 const r=await api.auth.getUser();user=r.data?.user||null;admin=false;company=null;
 if(user){let m=await db('management_users').select('user_id').eq('user_id',user.id).maybeSingle();admin=!!m.data;let b=await db('businesses').select('*').eq('owner_id',user.id).maybeSingle();company=b.data||null;}
 const c=await db('contact_settings').select('*').eq('singleton',true).maybeSingle();contact=c.data||{};
}
function auth(){
let reg=formMode==='register'&&mode==='business';
root.innerHTML='<div class="auth-card"><div class="auth-art"><div><b>FIKova for Business</b><h1>Grow your shop with FIKova.</h1><p>Secure registration and a centrally managed company directory inspired by Assurance Regent.</p></div><small>Manual payments. Management-controlled activation.</small></div><div class="auth-content"><h2>'+ (mode==='management'?'FIKova Management':'Business accounts')+'</h2><p class="muted">All registration and product data is stored online in Supabase.</p><div class="tabs"><button class="tab '+(reg?'active':'')+'" data-mode="register">Business registration</button><button class="tab '+(!reg?'active':'')+'" data-mode="login">Sign in</button></div><form id="authForm"><div class="fields">'+(reg?[
['owner_name','Owner full name'],['business_name','Business name'],['category','Business category'],['location','Business location'],['phone','Official business phone']
].map(x=>'<label class="field">'+x[1]+'<input name="'+x[0]+'" required maxlength="140"></label>').join('')+
'<label class="field">Country<select name="country_code"><option value="ZM">Zambia</option><option value="UG">Uganda</option><option value="KE">Kenya</option><option value="TZ">Tanzania</option></select></label><label class="field">Currency<select name="currency"><option>ZMW</option><option>UGX</option><option>KES</option><option>TZS</option><option>USD</option></select></label>':'')+
'<label class="field">Email<input required name="email" type="email" autocomplete="email"></label><label class="field">Password<input required name="password" type="password" minlength="8"></label></div><div id="authError"></div><div class="btn-row"><button class="primary" type="submit">'+(reg?'Create business account':'Sign in')+'</button><button class="quiet" type="button" id="backToMarket">Marketplace</button></div></form><p class="muted">New businesses remain pending until Management verifies registration and any payment. An email verification step may be required.</p></div></div>';
root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{formMode=b.dataset.mode;mode='business';auth();});
$('backToMarket').onclick=()=>{page='market';render();};
$('authForm').onsubmit=async e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f));let btn=f.querySelector('[type=submit]');btn.disabled=true;
try{
 if(reg){
 const info={owner_name:d.owner_name,business_name:d.business_name,category:d.category,location:d.location,phone:d.phone,country_code:d.country_code,currency:d.currency};
 const res=await api.auth.signUp({email:d.email,password:d.password,options:{data:{fikova_business_registration:info},emailRedirectTo:location.origin+location.pathname}});
 if(res.error)throw res.error;
 if(res.data.session){user=res.data.user;await registerBusiness(info);await identity();page='owner';render();toast('Business saved to Supabase. Approval pending.');}
 else $('authError').innerHTML='<div class="notice good">Account created. Please verify your email, then sign in to complete registration.</div>';
 }else{
 await one(api.auth.signInWithPassword({email:d.email,password:d.password}));
 await identity();
 if(mode==='management'&&!admin)throw Error('This account is not appointed as FIKova Management. Ask the system administrator to authorize your verified Supabase account.');
 page=admin?'management':company?'owner':'profile';render();
 }
}catch(e){catchErr('authError',e);}
finally{if(btn.isConnected)btn.disabled=false;}
};}
async function registerBusiness(info){
const b=info||user?.user_metadata?.fikova_business_registration||{};
const data={owner_id:user.id,owner_name:b.owner_name,business_name:b.business_name,business_email:user.email,phone:b.phone,category:b.category||'Other',location:b.location||'',country_code:b.country_code||'ZM',currency:b.currency||'ZMW',status:'pending'};
if(!data.business_name||!data.owner_name||!data.phone)throw Error('Please fill in company details.');
return one(db('businesses').insert(data).select().single());
}
function profile(){
const b=user?.user_metadata?.fikova_business_registration||{};
root.innerHTML=heading('Complete business registration','Your verified account needs a registered company record.')+'<div class="card"><form id="profileForm"><div class="fields">'+[['owner_name','Owner name'],['business_name','Business name'],['category','Category'],['location','Location'],['phone','Phone']].map(x=>'<label class="field">'+x[1]+'<input name="'+x[0]+'" value="'+esc(b[x[0]]||'')+'" required></label>').join('')+'<label class="field">Country<input name="country_code" value="'+esc(b.country_code||'ZM')+'"></label><label class="field">Currency<input name="currency" value="'+esc(b.currency||'ZMW')+'"></label></div><button class="primary" style="margin-top:14px">Save business to database</button><div id="profileError"></div></form></div>';
$('profileForm').onsubmit=async e=>{e.preventDefault();try{await registerBusiness(Object.fromEntries(new FormData(e.target)));await identity();page='owner';render();}catch(err){catchErr('profileError',err);}};}
function owner(){
let text=company.status==='active'?'Your shop is active and published products appear in the marketplace.':company.status==='pending'?'Registration pending. You can prepare products, but they remain hidden until FIKova approves your account.':'Your account is suspended and products are hidden. Contact FIKova to confirm payment or request help.';
nav('owner','My Business','Company profile, activation status and FIKova contact details.',
'<div class="card"><div class="split"><div><h3>'+esc(company.business_name)+'</h3><span class="muted">'+esc(company.code)+' · '+esc(company.location)+'</span></div>'+badge(company.status)+'</div><div class="notice '+(company.status==='active'?'good':'')+'">'+esc(text)+'</div>'+contactBlock()+'</div><div class="grid"><div class="stat"><small>Registered</small><strong>'+esc(new Date(company.registered_at).toLocaleDateString())+'</strong></div><div class="stat"><small>Country / currency</small><strong>'+esc(company.country_code)+' / '+esc(company.currency)+'</strong></div></div>');}
async function myProducts(){
nav('products','My products','Create listings, upload product photos, and manage your catalogue.','<div id="productArea">Loading products…</div>');
try{
const items=await one(db('products').select('*').eq('business_id',company.id).order('created_at',{ascending:false}));
if(!$('productArea'))return;
$('productArea').innerHTML='<div class="card"><h3>Add or edit product</h3><form id="productForm"><input type="hidden" name="id"><div class="fields"><label class="field">Name<input name="name" required maxlength="140"></label><label class="field">Category<input name="category" required></label><label class="field">Price<input name="price" type="number" step=".01" min=".01" required></label><label class="field">Currency<input name="currency" value="'+esc(company.currency)+'" required></label><label class="field span2">Description<textarea name="description"></textarea></label><label class="field span2">Photos (up to 4, maximum 5 MB each)<input name="photos" type="file" multiple accept="image/png,image/jpeg,image/webp"></label></div><div class="btn-row"><button class="primary">Save product</button><button type="reset" class="quiet">Reset</button></div><div id="productError"></div></form></div><div class="grid">'+items.map(p=>'<div class="card"><img class="product-photo" alt="'+esc(p.name)+'" src="'+esc(fileUrl(p.photo_paths?.[0]))+'"><h3>'+esc(p.name)+'</h3><p class="product-price">'+money(p.price,p.currency)+'</p><p class="muted">'+esc(p.category)+'</p><div class="btn-row"><button class="ghost" data-edit="'+p.id+'">Edit</button><button class="danger" data-del="'+p.id+'">Delete</button></div></div>').join('')+'</div>';
const f=$('productForm');
$('productArea').querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{const p=items.find(x=>x.id===b.dataset.edit);if(!p)return;['id','name','category','price','currency','description'].forEach(k=>f.elements[k].value=p[k]||'');f.scrollIntoView({behavior:'smooth'});});
$('productArea').querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{if(!confirm('Delete this product?'))return;try{const p=items.find(x=>x.id===b.dataset.del);await one(db('products').delete().eq('id',p.id));if(p.photo_paths?.length)await api.storage.from(bucket).remove(p.photo_paths);toast('Product deleted');myProducts();}catch(e){toast(e.message);}});
f.onsubmit=async e=>{e.preventDefault();const btn=f.querySelector('[type=submit]');btn.disabled=true;
try{
const d=Object.fromEntries(new FormData(f)),old=items.find(x=>x.id===d.id),files=Array.from(f.elements.photos.files||[]),paths=[];
if(files.length>4)throw Error('Select at most four photographs.');
if(!old&&!files.length)throw Error('Upload a product photo.');
for(const file of files){
if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5242880)throw Error('Photos must be PNG/JPEG/WebP under 5 MB.');
const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg',path=user.id+'/'+crypto.randomUUID()+'.'+ext;
await one(api.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false}));paths.push(path);
}
const row={business_id:company.id,name:d.name.trim(),category:d.category.trim(),price:Number(d.price),currency:d.currency,description:d.description||'',photo_paths:paths.length?paths:(old?.photo_paths||[]),updated_at:new Date().toISOString()};
if(old)await one(db('products').update(row).eq('id',old.id));
else await one(db('products').insert(row));
if(old&&paths.length&&old.photo_paths?.length)await api.storage.from(bucket).remove(old.photo_paths);
toast('Product stored in Supabase');myProducts();
}catch(e){catchErr('productError',e);}finally{if(btn.isConnected)btn.disabled=false;}
};
}catch(e){catchErr('productArea',e);}
}
async function inbox(){
nav('inbox','Messages & payments','FIKova payment instructions, activation status and account notices.','<div id="inboxArea">Loading messages…</div>');
try{
const [msgs,bill]=await Promise.all([one(db('business_notices').select('*').eq('business_id',company.id).order('created_at',{ascending:false})),one(db('business_billing').select('*').eq('business_id',company.id).maybeSingle())]);
$('inboxArea').innerHTML='<div class="card"><h3>Billing</h3><p>Subscription: '+money(bill?.monthly_amount,bill?.payment_currency||company.currency)+'</p><p class="muted">Due date: '+esc(bill?.next_due_date||'To be confirmed')+'</p><p class="muted">'+esc(bill?.billing_message||'Please contact Management for payment.')+'</p><p class="muted">'+esc(bill?.bank_or_mobile_instructions||'')+'</p>'+contactBlock()+'</div><div class="card"><h3>Account messages</h3>'+msgs.map(x=>'<div class="list-card"><b>'+esc(x.title)+'</b> <span class="badge">'+esc(x.category)+'</span><p class="muted">'+time(x.created_at)+'</p><p class="muted">'+esc(x.body)+'</p></div>').join('')+(msgs.length?'':'<div class="empty">No notices yet.</div>')+'</div>';
}catch(e){catchErr('inboxArea',e);}
}
async function market(){
root.innerHTML=heading('FIKova Marketplace','Browse products from activated businesses only.')+'<div class="btn-row" style="margin-bottom:20px">'+(!user?'<button class="primary" data-auth="register">Register your business</button><button class="ghost" data-auth="login">Sign in</button><button class="ghost" data-auth="management">FIKova Management</button>':'<button class="primary" id="backAccount">My account</button>')+'</div><div id="marketArea">Loading products…</div>';
root.querySelectorAll('[data-auth]').forEach(b=>b.onclick=()=>{mode=b.dataset.auth==='management'?'management':'business';formMode=b.dataset.auth==='register'?'register':'login';page='auth';render();});
if($('backAccount'))$('backAccount').onclick=()=>{page=admin?'management':'owner';render();};
try{
const [shops,items]=await Promise.all([one(db('businesses').select('id,business_name,phone,status').eq('status','active')),one(db('products').select('*').eq('published',true).order('created_at',{ascending:false}))]);
const m=new Map(shops.map(c=>[c.id,c]));
$('marketArea').innerHTML='<div class="card"><label class="field">Search products or companies<input id="marketSearch" type="search" placeholder="Search catalogue"></label></div><div id="marketResults"></div>';
function draw(){
const v=($('marketSearch')?.value||'').toLowerCase(),matches=items.filter(x=>m.has(x.business_id)&&[x.name,x.category,m.get(x.business_id).business_name].join(' ').toLowerCase().includes(v));
$('marketResults').innerHTML='<div class="grid">'+matches.map(p=>{const b=m.get(p.business_id),phone=String(b.phone||'').replace(/\D/g,'');return '<div class="card"><img class="product-photo" alt="'+esc(p.name)+'" src="'+esc(fileUrl(p.photo_paths?.[0]))+'"><h3>'+esc(p.name)+'</h3><p class="product-price">'+money(p.price,p.currency)+'</p><p class="muted">'+esc(b.business_name)+' · '+esc(p.category)+'</p><p class="muted">'+esc(p.description)+'</p>'+(phone?'<a class="primary" target="_blank" rel="noopener" style="text-decoration:none" href="https://wa.me/'+phone+'?text='+encodeURIComponent('Hello, I am interested in '+p.name+' listed on FIKova.')+'">Contact seller</a>':'')+'</div>';}).join('')+'</div>'+(!matches.length?'<div class="empty">No active business products found.</div>':'');
} $('marketSearch').oninput=draw;draw();
}catch(e){catchErr('marketArea',e);}
}
async function loadAdmin(){
[companies,products,bills,notices]=await Promise.all([
one(db('businesses').select('*').order('registered_at',{ascending:false}).limit(500)),one(db('products').select('*').limit(1000)),one(db('business_billing').select('*')),one(db('business_notices').select('*').order('created_at',{ascending:false}).limit(100))]);
}
async function management(){
nav('management','Companies directory','Assurance Regent-inspired company cards, activation toggles, editable business records and billing controls.','<div id="directory">Loading company directory…</div>');
try{await loadAdmin();drawDirectory();}catch(e){catchErr('directory',e);}
}
function drawDirectory(){
const host=$('directory');if(!host)return;
host.innerHTML='<div class="grid"><div class="stat"><small>Businesses</small><strong>'+companies.length+'</strong></div><div class="stat"><small>Pending approvals</small><strong>'+companies.filter(x=>x.status==='pending').length+'</strong></div><div class="stat"><small>Active</small><strong>'+companies.filter(x=>x.status==='active').length+'</strong></div></div><div class="card" style="margin-top:17px"><label class="field">Search companies<input id="companySearch" placeholder="Name, code, location"></label><div id="companiesList"></div></div>';
function draw(){
const term=($('companySearch')?.value||'').toLowerCase();
$('companiesList').innerHTML=companies.filter(c=>[c.business_name,c.code,c.owner_name,c.location].join(' ').toLowerCase().includes(term)).map(c=>{
const bill=bills.find(x=>x.business_id===c.id);
return '<div class="list-card"><div class="company-head"><div><h3 class="company-title">'+esc(c.business_name)+'</h3><div class="company-code">'+esc(c.code)+' · '+esc(c.category)+'</div></div>'+badge(c.status)+'</div><p class="company-meta">'+esc(c.owner_name)+' · '+esc(c.business_email)+' · '+esc(c.phone)+'<br>'+esc(c.location)+' · '+esc(c.country_code)+' · '+esc(c.currency)+' · '+products.filter(p=>p.business_id===c.id).length+' products</p><div class="billing"><div class="split"><b>Monthly: '+money(bill?.monthly_amount,bill?.payment_currency||c.currency)+'</b><label class="switch"><input type="checkbox" data-active="'+c.id+'" '+(c.status==='active'?'checked':'')+'> Activated</label></div></div><div class="btn-row"><button class="ghost" data-edit="'+c.id+'">Edit company & billing</button><button class="quiet" data-notice="'+c.id+'">Send payment notice</button></div></div>';
}).join('')||'<div class="empty">No businesses registered yet.</div>';
host.querySelectorAll('[data-active]').forEach(x=>x.onchange=async()=>{
const c=companies.find(y=>y.id===x.dataset.active),active=x.checked;if(!confirm((active?'Activate':'Suspend')+' '+c.business_name+'? Verify manual payment before activation.')){x.checked=!active;return;}
try{await one(db('businesses').update({status:active?'active':'suspended',activated_at:active?new Date().toISOString():c.activated_at}).eq('id',c.id));
await sendNotice(c.id,active?'Account activated':'Account suspended',active?'FIKova activated your business. Your published products can now appear in the marketplace.':'FIKova suspended your account. Contact Management to confirm payment or ask for assistance.',active?'activation':'suspension');
toast('Business status saved.');management();}catch(e){toast(e.message);x.checked=!active;}
});
host.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>editCompany(x.dataset.edit));
host.querySelectorAll('[data-notice]').forEach(x=>x.onclick=()=>{window.fikovaSelected=x.dataset.notice;page='notices';render();});
} $('companySearch').oninput=draw;draw();
}
async function editCompany(id){
const c=companies.find(b=>b.id===id),bill=bills.find(b=>b.business_id===id)||{};
if(!c)return;
const fields=[['business_name','Company name',c.business_name],['owner_name','Owner name',c.owner_name],['business_email','Email',c.business_email],['phone','Phone',c.phone],['category','Category',c.category],['location','Location',c.location],['country_code','Country',c.country_code],['currency','Currency',c.currency],['monthly_amount','Monthly fee',bill.monthly_amount||0],['payment_currency','Payment currency',bill.payment_currency||c.currency],['next_due_date','Due date',bill.next_due_date||''],['billing_message','Billing message',bill.billing_message||'']];
nav('management','Edit company','Management can change every company field and billing policy. Owners cannot activate themselves.','<div class="card"><h3>'+esc(c.business_name)+' · '+esc(c.code)+'</h3><form id="editForm"><div class="fields">'+fields.map(x=>'<label class="field">'+x[1]+'<input name="'+x[0]+'" value="'+esc(x[2])+'" '+(x[0]==='next_due_date'?'type="date"':'')+'></label>').join('')+'<label class="field span2">Direct payment instructions<textarea name="bank_or_mobile_instructions">'+esc(bill.bank_or_mobile_instructions||'')+'</textarea></label></div><div class="btn-row"><button class="primary">Save company</button><button type="button" class="quiet" id="editBack">Cancel</button></div><div id="editError"></div></form></div>');
$('editBack').onclick=()=>{page='management';render();};
$('editForm').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
try{
let info={};['business_name','owner_name','business_email','phone','category','location','country_code','currency'].forEach(k=>info[k]=String(d[k]||'').trim());info.updated_at=new Date().toISOString();
await one(db('businesses').update(info).eq('id',id));
await one(db('business_billing').upsert({business_id:id,monthly_amount:Number(d.monthly_amount)||0,payment_currency:d.payment_currency||c.currency,next_due_date:d.next_due_date||null,billing_message:d.billing_message||'',bank_or_mobile_instructions:d.bank_or_mobile_instructions||'',updated_at:new Date().toISOString()},{onConflict:'business_id'}));
toast('Business changes saved');management();
}catch(e){catchErr('editError',e);}
};}
async function sendNotice(id,title,body,category='payment'){
return one(db('business_notices').insert({business_id:id,title,body,category,author_id:user.id}));}
async function messageManager(){
nav('notices','Business communications','Issue payment reminders and registration requests directly to owners’ accounts.','<div id="noticesArea">Loading…</div>');
try{
await loadAdmin();
$('noticesArea').innerHTML='<div class="card"><h3>Send notice</h3><form id="sendForm"><div class="fields"><label class="field">Business<select name="business_id">'+companies.map(c=>'<option value="'+c.id+'" '+(window.fikovaSelected===c.id?'selected':'')+'>'+esc(c.business_name)+'</option>').join('')+'</select></label><label class="field">Type<select name="category"><option value="payment">Payment request</option><option value="general">General</option><option value="registration">Registration</option></select></label><label class="field span2">Subject<input name="title" required value="FIKova payment reminder"></label><label class="field span2">Message<textarea name="body" required>Dear business owner, please contact FIKova Management for verified bank or mobile-money payment instructions. Contact us for any requests or questions.</textarea></label></div><button class="primary" style="margin-top:15px">Send to business account</button><div id="sendError"></div></form></div><div class="card"><h3>Recent notices</h3>'+notices.map(n=>'<div class="list-card"><b>'+esc(n.title)+'</b><span class="badge">'+esc(n.category)+'</span><p class="muted">'+time(n.created_at)+' · '+esc(companies.find(c=>c.id===n.business_id)?.business_name||'Business')+'</p><p class="muted">'+esc(n.body)+'</p></div>').join('')+'</div>';
$('sendForm').onsubmit=async e=>{e.preventDefault();try{const d=Object.fromEntries(new FormData(e.target));await sendNotice(d.business_id,d.title,d.body,d.category);toast('Notice saved to the database');messageManager();}catch(e){catchErr('sendError',e);}};
}catch(e){catchErr('noticesArea',e);}
}
async function catalogue(){
nav('catalogue','Product catalogue','Management can moderate products across companies.','<div id="catalogueArea">Loading products…</div>');
try{await loadAdmin();$('catalogueArea').innerHTML='<div class="grid">'+products.map(p=>'<div class="card"><img class="product-photo" src="'+esc(fileUrl(p.photo_paths?.[0]))+'" alt="'+esc(p.name)+'"><h3>'+esc(p.name)+'</h3><p class="product-price">'+money(p.price,p.currency)+'</p><p class="muted">'+esc(companies.find(c=>c.id===p.business_id)?.business_name||'Business')+'</p><button data-toggle="'+p.id+'" class="quiet">'+(p.published?'Hide':'Publish')+'</button></div>').join('')+'</div>';root.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=async()=>{const p=products.find(x=>x.id===b.dataset.toggle);try{await one(db('products').update({published:!p.published}).eq('id',p.id));toast('Listing updated');catalogue();}catch(e){toast(e.message);}});}catch(e){catchErr('catalogueArea',e);}
}
function contacts(){
nav('contacts','Official FIKova contacts','Manage the contact channels used for manual business payments and account support.','<div class="card"><form id="contactsForm"><div class="fields"><label class="field">WhatsApp number<input name="whatsapp" value="'+esc(contact.whatsapp||'')+'"></label><label class="field">Email<input type="email" name="email" value="'+esc(contact.email||'')+'"></label><label class="field span2">Payment instructions<textarea name="payment_help">'+esc(contact.payment_help||'')+'</textarea></label></div><button class="primary" style="margin-top:15px">Save settings</button><div id="contactsError"></div></form></div>');
$('contactsForm').onsubmit=async e=>{e.preventDefault();try{await one(db('contact_settings').update(Object.fromEntries(new FormData(e.target))).eq('singleton',true));toast('Contacts saved');await identity();}catch(e){catchErr('contactsError',e);}};}
async function audit(){
nav('audit','Management audit','Recorded business status changes and messages.','<div id="auditArea">Loading audit…</div>');
try{const logs=await one(db('admin_audit').select('*').order('created_at',{ascending:false}).limit(100));
$('auditArea').innerHTML='<div class="card table-scroll"><table><thead><tr><th>Date</th><th>Event</th><th>Company ID</th><th>Detail</th></tr></thead><tbody>'+logs.map(a=>'<tr><td>'+time(a.created_at)+'</td><td>'+esc(a.event_type)+'</td><td>'+esc(a.business_id)+'</td><td>'+esc(JSON.stringify(a.detail))+'</td></tr>').join('')+'</tbody></table></div>';}catch(e){catchErr('auditArea',e);}
}
function render(){
$('signoutTop').classList.toggle('hidden',!user);
if(page==='market')return market();
if(!user)return auth();
if(admin){if(page==='catalogue')return catalogue();if(page==='notices')return messageManager();if(page==='contacts')return contacts();if(page==='audit')return audit();page='management';return management();}
if(!company){page='profile';return profile();}
if(page==='products')return myProducts();if(page==='inbox')return inbox();
page='owner';return owner();
}
$('marketTop').onclick=()=>{page='market';render();};
$('signoutTop').onclick=async()=>{await api.auth.signOut();user=null;company=null;admin=false;page='market';render();};
async function boot(){if(!api){root.innerHTML=alertBox('Supabase client could not load. Check your connection.');return;}try{
await identity();if(user)page=admin?'management':company?'owner':'profile';render();
api.auth.onAuthStateChange(()=>setTimeout(async()=>{await identity();if(page!=='market')page=admin?'management':user?(company?'owner':'profile'):'auth';render();},0));
}catch(e){root.innerHTML=alertBox(e.message);}}
boot();
})();