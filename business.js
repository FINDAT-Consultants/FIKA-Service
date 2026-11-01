(function fikovaBusinessModule(){
  'use strict';
  // This module extends the existing browser-local FIKA demo.
  // It is not a shared, server-enforced authorization or payments backend.
  const PRODUCT_KEY='fika_business_products_v1';
  const MESSAGE_KEY='fika_business_messages_v1';
  const CONTACT_KEY='fika_business_contacts_v1';
  const $=(selector,root=document)=>root.querySelector(selector);
  const esc=(s)=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const read=(key,fallback)=>{try{const value=JSON.parse(localStorage.getItem(key)||'null');return value===null?fallback:value;}catch(_){return fallback;}};
  const persist=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));return true;}catch(_){alert('This browser has run out of local storage. Please use smaller photos or remove older listings.');return false;}};
  const products=()=>{const a=read(PRODUCT_KEY,[]);return Array.isArray(a)?a:[];};
  const messages=()=>{const a=read(MESSAGE_KEY,[]);return Array.isArray(a)?a:[];};
  const contacts=()=>{const c=read(CONTACT_KEY,{});return c&&typeof c==='object'?c:{};};
  const account=(id)=>users.find(x=>String(x.id)===String(id)&&x.role==='business');
  const isActive=(u)=>!!(u&&u.role==='business'&&u.businessStatus==='active');
  const stamp=()=>new Date().toISOString();
  const newId=(prefix)=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
  const status=(u)=>isActive(u)?'Active':u?.businessStatus==='suspended'?'Suspended':'Pending approval';
  const safeImage=(url)=>/^data:image\/(png|jpeg|webp);base64,/i.test(url||'')?url:'';
  const owner=()=>currentUser?.role==='business'?account(currentUser.id):null;
  function sendNotice(id,kind,body){
    const next=messages();
    next.unshift({id:newId('msg'),businessId:id,kind,body:String(body).slice(0,700),createdAt:stamp(),readAt:null});
    persist(MESSAGE_KEY,next.slice(0,500));
  }
  function contactLinks(subject){
    const c=contacts();
    const phone=String(c.whatsapp||'').replace(/\D/g,'');
    const pieces=[];
    if(phone.length>=8&&phone.length<=15){
      pieces.push('<a class="fb-btn fb-secondary" target="_blank" rel="noopener noreferrer" href="https://wa.me/'+phone+'?text='+encodeURIComponent(subject)+'">WhatsApp FIKova</a>');
    }
    if(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email||'')){
      pieces.push('<a class="fb-btn fb-secondary" href="mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent(subject)+'">Email FIKova</a>');
    }
    if(!pieces.length) pieces.push('<div class="fb-muted">Contact FIKova Management or visit its offices for registration, payment details, or help. Management has not configured a direct contact yet.</div>');
    if(c.instructions)pieces.push('<div class="fb-muted">'+esc(c.instructions)+'</div>');
    return '<div class="fb-contact">'+pieces.join('')+'</div>';
  }
  const style=document.createElement('style');
  style.textContent=`
    .fb-wrap{font-family:system-ui,Segoe UI,Arial,sans-serif;color:var(--text,#17212b);max-width:1100px;margin:0 auto;padding:12px 4px 36px}
    .fb-wrap *{box-sizing:border-box}
    .fb-title{font-size:23px;font-weight:900;margin:0 0 8px}
    .fb-sub{font-size:13px;line-height:1.5;color:var(--muted,#697586);margin:5px 0 15px}
    .fb-panel{border:1px solid var(--line,#e5e7eb);border-radius:17px;background:var(--card,#fff);padding:16px;margin:12px 0;box-shadow:0 4px 15px rgba(0,0,0,.03)}
    .fb-banner{padding:12px 14px;border-left:5px solid #ca3c38;background:rgba(202,60,56,.07);border-radius:9px;margin:10px 0;font-size:13px;line-height:1.5}
    .fb-banner.good{border-color:#16905d;background:rgba(22,144,93,.08)}
    .fb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:12px}
    .fb-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:10px 0}
    .fb-field{display:flex;flex-direction:column;gap:5px;flex:1;min-width:175px;font-size:12px;font-weight:700}
    .fb-field input,.fb-field select,.fb-field textarea{width:100%;padding:11px;border:1px solid #cbd5e1;border-radius:10px;color:#152235;background:#fff;font:inherit;font-size:13px}
    .fb-field textarea{resize:vertical;min-height:72px}
    .fb-btn{border:0;background:#bd1f32;color:white;font:700 12px system-ui,Arial;padding:10px 14px;border-radius:10px;cursor:pointer;display:inline-block;text-decoration:none}
    .fb-btn:hover{filter:brightness(.95)}
    .fb-secondary{background:#edf2f7;color:#17212b;border:1px solid #cbd5e1}
    .fb-danger{background:#9d2331}
    .fb-btn:disabled{opacity:.5;cursor:not-allowed}
    .fb-muted{font-size:12px;color:var(--muted,#697586);line-height:1.6;margin:6px 0}
    .fb-contact{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:12px}
    .fb-photo{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:12px;background:#edf2f7}
    .fb-card{border:1px solid var(--line,#e5e7eb);padding:11px;border-radius:14px;background:var(--card,#fff);min-width:0}
    .fb-card h3{font-size:15px;margin:9px 0 4px;overflow-wrap:anywhere}
    .fb-tag{display:inline-block;font-size:11px;font-weight:800;padding:5px 9px;background:#f1f5f9;color:#334155;border-radius:99px}
    .fb-price{font-size:15px;font-weight:900;margin:6px 0}
    .fb-msg{padding:11px;border:1px solid #e2e8f0;border-radius:11px;margin:7px 0}
    .fb-msg strong{font-size:13px}
    .fb-msg p{font-size:12px;margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}
    .fb-adminrow{border-bottom:1px solid #e2e8f0;padding:12px 0;display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px}
    .fb-switch{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:800}
    .fb-switch input{accent-color:#13895c;width:19px;height:19px}
    .fb-note{color:#92400e;font-size:11px}
    #signupBusinessFields.hidden{display:none!important}
    @media(max-width:600px){.fb-panel{padding:12px}.fb-title{font-size:19px}}
  `;
  document.head.appendChild(style);
  function activeOwnerPage(){
    const u=owner();
    if(!u)return '<div class="fb-banner">Business account could not be found. Sign out and sign in again.</div>';
    const active=isActive(u);
    const note=active?'Your shop is active. Published products are visible to customers.':u.businessStatus==='suspended'?'Your shop is suspended. Products are hidden until FIKova Management confirms your manual payment and reactivates the account.':'Your registration is awaiting FIKova Management approval. You can prepare products, but customers cannot see them until activation.';
    const myMsgs=messages().filter(m=>m.businessId===u.id);
    const myProducts=products().filter(p=>p.businessId===u.id);
    const list=myProducts.map(p=>`<div class="fb-card">
      ${p.photos?.[0]?`<img class="fb-photo" alt="${esc(p.name)}" src="${safeImage(p.photos[0])}">`:''}
      <h3>${esc(p.name)}</h3><div class="fb-price">${esc(p.currency||'ZMW')} ${esc(p.price)}</div>
      <div class="fb-muted">${esc(p.category||'Other')} · ${p.photos?.length||0} photo(s)</div>
      <div class="fb-row"><button class="fb-btn fb-secondary" type="button" data-fb-edit="${esc(p.id)}">Edit</button>
      <button class="fb-btn fb-danger" type="button" data-fb-delete="${esc(p.id)}">Delete</button></div>
      </div>`).join('');
    return `<div class="fb-wrap" id="fbOwnerPage">
      <h2 class="fb-title">My Business · ${esc(u.businessName||u.name)}</h2>
      <div class="fb-banner ${active?'good':''}"><b>${status(u)}</b> — ${esc(note)}<br>Activation is approved by Management after direct confirmation of payment. No online payment gateway is connected.</div>
      <div class="fb-panel"><h3>Contact FIKova</h3><p class="fb-muted">Contact FIKova to confirm your registration, ask for manual bank/mobile-money payment instructions, or request support. Do not pay to an unverified account.</p>
      ${contactLinks('Hello FIKova, I need help with business account '+(u.businessName||u.name))}</div>
      <div class="fb-panel"><h3>My messages (${myMsgs.length})</h3>
      ${myMsgs.length?myMsgs.slice(0,30).map(m=>`<div class="fb-msg"><strong>${esc(m.kind)} · ${esc(new Date(m.createdAt).toLocaleString())}</strong><p>${esc(m.body)}</p></div>`).join(''):'<p class="fb-muted">No messages yet.</p>'}
      </div>
      <div class="fb-panel"><h3 id="fbProductFormTitle">Upload a product</h3><p class="fb-muted">Save up to 12 products and up to 3 photos per product (JPEG, PNG, WebP; 3 MB per original file). Drafts are hidden until activation. Photos stay in this browser.</p>
        <form id="fbProductForm">
          <input type="hidden" id="fbProductId">
          <div class="fb-row"><label class="fb-field">Product name<input id="fbProductName" required maxlength="90" placeholder="Product name"></label>
          <label class="fb-field">Category<input id="fbProductCategory" required maxlength="50" placeholder="Fashion, groceries, electronics..."></label></div>
          <div class="fb-row"><label class="fb-field">Price<input id="fbProductPrice" type="number" min="0.01" step="0.01" required></label>
          <label class="fb-field">Currency<select id="fbProductCurrency"><option>ZMW</option><option>UGX</option><option>USD</option></select></label></div>
          <div class="fb-row"><label class="fb-field">Product description<textarea id="fbProductDescription" maxlength="600" placeholder="Describe what buyers will receive"></textarea></label></div>
          <div class="fb-row"><label class="fb-field">Product photographs<input id="fbProductPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label></div>
          <div class="fb-row"><button class="fb-btn" type="submit">Save product</button><button class="fb-btn fb-secondary" type="button" id="fbCancelEdit">Clear form</button><span class="fb-muted" id="fbProductFeedback"></span></div>
        </form>
      </div>
      <div class="fb-panel"><h3>My products (${myProducts.length})</h3><div class="fb-grid">${list||'<p class="fb-muted">No products yet. Upload your first product above.</p>'}</div></div>
      <p class="fb-note">Demo limitation: this browser stores your account, messages, and images locally. A secure shared database and image storage are required for management approval and product visibility across devices.</p>
    </div>`;
  }
  function refreshOwner(){
    if(currentUser?.role!=='business')return;
    const body=$('#featureBody');
    if(body&&$('#fbOwnerPage',body)){body.innerHTML=activeOwnerPage();wireOwner(body);}
  }
  async function compress(file){
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>3*1024*1024)throw Error('Use JPEG, PNG, or WebP images smaller than 3 MB.');
    const blobUrl=URL.createObjectURL(file);
    try{
      const img=new Image();
      await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=blobUrl;});
      const max=750,scale=Math.min(1,max/Math.max(img.width,img.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
      const ctx=canvas.getContext('2d');
      if(!ctx)throw Error('Image processing is not available.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      let data=canvas.toDataURL('image/jpeg',.62);
      if(data.length>230000) data=canvas.toDataURL('image/jpeg',.38);
      if(data.length>230000)throw Error('This image is too large after processing. Choose a smaller photo.');
      return data;
    }finally{URL.revokeObjectURL(blobUrl);}
  }
  function wireOwner(root){
    const form=$('#fbProductForm',root); if(!form)return;
    $('#fbCancelEdit',root).onclick=()=>{form.reset();$('#fbProductId',root).value='';$('#fbProductFormTitle',root).textContent='Upload a product';};
    root.querySelectorAll('[data-fb-edit]').forEach(b=>b.onclick=()=>{
      const p=products().find(x=>x.id===b.dataset.fbEdit&&x.businessId===currentUser?.id);if(!p)return;
      $('#fbProductId',root).value=p.id;$('#fbProductName',root).value=p.name;
      $('#fbProductCategory',root).value=p.category;$('#fbProductPrice',root).value=p.price;
      $('#fbProductCurrency',root).value=p.currency||'ZMW';$('#fbProductDescription',root).value=p.description||'';
      $('#fbProductFormTitle',root).textContent='Edit product (new photos replace old photos)';
      form.scrollIntoView({behavior:'smooth',block:'nearest'});
    });
    root.querySelectorAll('[data-fb-delete]').forEach(b=>b.onclick=()=>{
      if(!confirm('Delete this product?'))return;
      persist(PRODUCT_KEY,products().filter(p=>!(p.id===b.dataset.fbDelete&&p.businessId===currentUser?.id)));
      refreshOwner();
    });
    form.onsubmit=async e=>{
      e.preventDefault();
      const user=owner(); if(!user){alert('Business account not found.');return;}
      const id=$('#fbProductId',root).value;
      const name=$('#fbProductName',root).value.trim();
      const category=$('#fbProductCategory',root).value.trim();
      const price=Number($('#fbProductPrice',root).value);
      const description=$('#fbProductDescription',root).value.trim();
      const currency=$('#fbProductCurrency',root).value;
      if(!name||!category||!Number.isFinite(price)||price<=0){alert('Provide a name, category, and valid price.');return;}
      const list=products(),existing=list.find(p=>p.id===id&&p.businessId===user.id);
      if(!existing&&list.filter(p=>p.businessId===user.id).length>=12){alert('Maximum 12 products per business in this demo.');return;}
      const files=Array.from($('#fbProductPhotos',root).files||[]);
      if(files.length>3){alert('Choose up to 3 images.');return;}
      let photos=existing?.photos||[];
      if(files.length){try{photos=await Promise.all(files.map(compress));}catch(err){alert(err.message||'Could not process photos.');return;}}
      if(!photos.length){alert('Upload at least one product photo.');return;}
      const next={id:existing?.id||newId('prod'),businessId:user.id,name,category,price:price.toFixed(2),currency,description,photos,updatedAt:stamp(),createdAt:existing?.createdAt||stamp()};
      if(existing) list.splice(list.indexOf(existing),1,next);else list.unshift(next);
      if(persist(PRODUCT_KEY,list))refreshOwner();
    };
  }
  function renderMarket(root){
    const activeUsers=users.filter(isActive);
    const visible=products().filter(p=>activeUsers.some(u=>u.id===p.businessId));
    root.innerHTML=`<div class="fb-wrap" id="fbMarket"><h2 class="fb-title">FIKova Marketplace</h2>
      <p class="fb-sub">Browse products from approved businesses. Buyers contact sellers directly; no online checkout or gateway is connected.</p>
      <div class="fb-row"><label class="fb-field">Search products or shops<input id="fbSearch" type="search" placeholder="Search name, category, business"></label></div>
      <div id="fbMarketCards"></div>
      <p class="fb-note">Listings are stored locally in this demo. Products from other browsers will require a shared backend.</p></div>`;
    const draw=()=>{
      const q=($('#fbSearch',root)?.value||'').toLowerCase();
      const subset=visible.filter(p=>{
        const u=account(p.businessId);
        return (p.name+' '+p.category+' '+(u?.businessName||'')).toLowerCase().includes(q);
      });
      $('#fbMarketCards',root).innerHTML=`<div class="fb-grid">${subset.map(p=>{
        const u=account(p.businessId),number=String(u?.phone||'').replace(/\D/g,'');
        const link=number.length>=8&&number.length<=15
          ?`<a class="fb-btn" target="_blank" rel="noopener noreferrer" href="https://wa.me/${number}?text=${encodeURIComponent('Hello, I am interested in '+p.name+' on FIKova.') }">Ask seller</a>`
          :'<span class="fb-muted">Seller contact unavailable</span>';
        return `<article class="fb-card">
          <img class="fb-photo" alt="${esc(p.name)}" src="${safeImage(p.photos?.[0])}">
          <h3>${esc(p.name)}</h3><span class="fb-tag">${esc(p.category)}</span>
          <div class="fb-price">${esc(p.currency||'ZMW')} ${esc(p.price)}</div>
          <div class="fb-muted">${esc(p.description||'')}</div>
          <div class="fb-muted"><b>Sold by:</b> ${esc(u?.businessName||u?.name||'Business')}</div>
          <div class="fb-row">${link}</div></article>`;
      }).join('')||'<p class="fb-muted">No approved business products found.</p>'}</div>`;
    };
    $('#fbSearch',root).addEventListener('input',draw);draw();
  }
  function renderAdmin(root){
    if(currentUser?.role!=='management'){root.innerHTML='';return;}
    const rows=users.filter(u=>u.role==='business');
    const c=contacts();
    root.innerHTML=`<div class="fb-wrap" id="fbAdminView">
      <h2 class="fb-title">Business registrations & activation</h2>
      <p class="fb-sub">Review registrations, activate verified businesses, suspend accounts when manual payment is due, and send private in-account payment notices.</p>
      <div class="fb-banner">Manual approval only. Verify the business and confirm payment directly before activating. This demo uses browser-local data and does not synchronize across different devices.</div>
      <div class="fb-panel">
      <h3>FIKova contact details for businesses</h3>
      <div class="fb-row">
      <label class="fb-field">Official WhatsApp number (with country code)<input id="fbContactPhone" placeholder="+260..." value="${esc(c.whatsapp||'')}"></label>
      <label class="fb-field">Official email (optional)<input id="fbContactEmail" type="email" placeholder="business@example.com" value="${esc(c.email||'')}"></label>
      </div><label class="fb-field">Other instructions (optional)<textarea id="fbContactInstructions" maxlength="400" placeholder="Visit our offices or contact us for verified bank/mobile-money details">${esc(c.instructions||'')}</textarea></label>
      <div class="fb-row"><button class="fb-btn" type="button" id="fbSaveContacts">Save contact details</button></div>
      <p class="fb-muted">Do not put private bank account numbers in the public source code. Confirm payment instructions directly with each business.</p>
      </div>
      <div class="fb-panel"><h3>Businesses (${rows.length})</h3><div class="fb-row"><label class="fb-field">Search business<input id="fbAdminSearch" type="search" placeholder="Name, phone, email"></label></div>
      <div id="fbAdminRows"></div></div>
    </div>`;
    $('#fbSaveContacts',root).onclick=()=>{
      const whatsapp=$('#fbContactPhone',root).value.trim();
      const email=$('#fbContactEmail',root).value.trim();
      const instructions=$('#fbContactInstructions',root).value.trim();
      if(whatsapp&&(!/^\+?\d[\d\s()-]{6,20}$/.test(whatsapp)||String(whatsapp).replace(/\D/g,'').length>15)){alert('Enter a valid WhatsApp number with country code.');return;}
      if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){alert('Enter a valid email address.');return;}
      if(persist(CONTACT_KEY,{whatsapp,email,instructions}))alert('Contact details saved for this browser.');
    };
    function draw(){
      const q=($('#fbAdminSearch',root)?.value||'').toLowerCase();
      const filtered=users.filter(u=>u.role==='business'&&(u.name+' '+(u.businessName||'')+' '+u.email+' '+u.phone).toLowerCase().includes(q));
      $('#fbAdminRows',root).innerHTML=filtered.map(u=>{
        const active=isActive(u),pCount=products().filter(p=>p.businessId===u.id).length;
        return `<div class="fb-adminrow" data-fb-business="${esc(u.id)}">
          <div style="flex:1;min-width:190px"><strong>${esc(u.businessName||u.name)}</strong> <span class="fb-tag">${status(u)}</span>
          <div class="fb-muted">Owner: ${esc(u.name)} · ${esc(u.phone)} · ${esc(u.email)}</div>
          <div class="fb-muted">${esc(u.businessCategory||'')} · ${esc(u.businessAddress||'')} · ${pCount} product(s)</div>
          <div class="fb-muted">Registered: ${esc((u.createdAt||'').slice(0,10))}</div></div>
          <div style="min-width:210px">
            <label class="fb-switch"><input type="checkbox" role="switch" aria-label="Activate ${esc(u.businessName||u.name)}" data-fb-toggle="${esc(u.id)}" ${active?'checked':''}> ${active?'Active — switch off to suspend':'Inactive — switch on to activate'}</label>
            <div class="fb-row"><button class="fb-btn fb-secondary" type="button" data-fb-payment="${esc(u.id)}">Send payment notice</button></div>
          </div>
        </div>`;
      }).join('')||'<p class="fb-muted">No business registrations on this device.</p>';
      root.querySelectorAll('[data-fb-toggle]').forEach(sw=>sw.onchange=()=>{
        const u=account(sw.dataset.fbToggle);if(!u)return;
        const next=sw.checked?'active':'suspended';
        const label=next==='active'?'activate':'suspend';
        if(!confirm('Are you sure you want to '+label+' '+(u.businessName||u.name)+'? Confirm any manual payment outside this system first.')){sw.checked=!sw.checked;return;}
        const old=u.businessStatus||'pending';
        u.businessStatus=next;u.businessUpdatedAt=stamp();
        try{saveUsers();}
        catch(_){u.businessStatus=old;alert('Could not save change.');draw();return;}
        const msg=next==='active'
          ?'FIKova Management has activated your business account. Your saved products are now eligible to appear in the marketplace on this device.'
          :'Your FIKova business account has been deactivated. To restore your listings, please contact FIKova Management and arrange the required manual payment or discuss any query. Your products are hidden while inactive.';
        sendNotice(u.id,next==='active'?'Account activated':'Payment and account suspension',msg);
        draw();
      });
      root.querySelectorAll('[data-fb-payment]').forEach(btn=>btn.onclick=()=>{
        const u=account(btn.dataset.fbPayment);if(!u)return;
        const extra=prompt('Optional payment reference, due date, or instructions for '+(u.businessName||u.name)+' (leave blank for a general reminder):','');
        if(extra===null)return;
        const note='FIKova business subscription payment notice: Please contact FIKova Management to obtain verified bank or mobile-money payment details and confirm payment for your account. Contact us for questions or requests.'+(extra.trim()?'\nManagement note: '+extra.trim().slice(0,300):'');
        sendNotice(u.id,'Payment required',note);
        alert('Payment notice saved to this business inbox on this browser.');
      });
    }
    $('#fbAdminSearch',root).addEventListener('input',draw);draw();
  }
  function showBusinessFeature(feature){
    const body=$('#featureBody'),title=$('#featureTitle');
    if(!body||!title)return;
    body.innerHTML='';
    title.textContent=feature==='business'?'My Business':feature==='marketplace'?'Marketplace':'Business Administration';
    if(feature==='business'){body.innerHTML=activeOwnerPage();wireOwner(body);}
    else if(feature==='marketplace')renderMarket(body);
    else renderAdmin(body);
    showFeature();
  }
  function configureSignup(){
    const loginRole=$('#loginRole');
    if(loginRole&&!loginRole.querySelector('[value="business"]'))loginRole.insertAdjacentHTML('beforeend','<option value="business">Business</option>');
    const picker=$('#signupRolePick'),select=$('#signupRole');
    if(picker&&!picker.querySelector('[data-role="business"]')){
      const option=document.createElement('button');option.type='button';option.className='roleOption';
      option.dataset.role='business';option.setAttribute('aria-selected','false');
      option.innerHTML='<i class="fa-solid fa-store"></i><span>Business</span>';
      const locked=picker.querySelector('[data-role="management"]');
      picker.insertBefore(option,locked||null);
    }
    if(select&&!select.querySelector('[value="business"]'))select.insertAdjacentHTML('beforeend','<option value="business">Business</option>');
    if(select&&!$('#signupBusinessFields')){
      const fields=document.createElement('div');fields.id='signupBusinessFields';fields.className='hidden';
      fields.innerHTML=`<div class="field"><label for="signupBusinessName">Business / shop name</label><div class="authInputWrap"><input id="signupBusinessName" type="text" maxlength="100" placeholder="Your registered shop name"></div></div>
      <div class="field"><label for="signupBusinessCategory">Business category</label><div class="authInputWrap"><input id="signupBusinessCategory" type="text" maxlength="60" placeholder="Retail, food, fashion..."></div></div>
      <div class="field"><label for="signupBusinessAddress">Business location</label><div class="authInputWrap"><input id="signupBusinessAddress" type="text" maxlength="160" placeholder="Town, area or business address"></div></div>
      <div class="tinyNote">Business registration is free to submit but remains inactive until FIKova Management confirms registration and manual payment. Contact FIKova directly for payment instructions. Your account is saved on this device only.</div>`;
      select.closest('.field')?.insertAdjacentElement('afterend',fields);
    }
    const sync=()=>{const el=$('#signupBusinessFields');if(el)el.classList.toggle('hidden',select?.value!=='business');};
    select?.addEventListener('change',sync);picker?.addEventListener('click',()=>setTimeout(sync,0));sync();
    document.addEventListener('click',async e=>{
      if(!e.target.closest('#signupBtn')||$('#signupRole')?.value!=='business')return;
      e.preventDefault();e.stopImmediatePropagation();
      const err=$('#authErrorSignup');err.textContent='';
      const name=$('#signupName').value.trim(),email=$('#signupEmail').value.trim().toLowerCase(),phone=$('#signupPhone').value.trim(),pwd=$('#signupPassword').value;
      const businessName=$('#signupBusinessName').value.trim(),category=$('#signupBusinessCategory').value.trim(),address=$('#signupBusinessAddress').value.trim();
      if(!name||!businessName||!category||!address||!phone||!pwd||!email){err.textContent='Please complete owner, business, contact, and password fields.';return;}
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){err.textContent='Enter a valid email.';return;}
      if(pwd.length<8){err.textContent='Use at least 8 characters for the password.';return;}
      const digits=phone.replace(/\D/g,'');if(digits.length<8){err.textContent='Please enter a valid contact phone number.';return;}
      if(users.some(u=>u.role==='business'&&(String(u.email).toLowerCase()===email||String(u.phone).replace(/\D/g,'')===digits))){err.textContent='A business account with this email or phone already exists.';return;}
      const user={id:newId('business'),name,businessName,businessCategory:category,businessAddress:address,email,phone,username:email.split('@')[0],password:pwd,role:'business',businessStatus:'pending',createdAt:stamp(),theme:'light',mapStyle:'standard'};
      users.push(user);
      try{saveUsers();}
      catch(_){users=users.filter(x=>x.id!==user.id);err.textContent='Cannot save the registration. Browser storage may be full.';return;}
      sendNotice(user.id,'Registration pending','Your business registration was received on this device. Your account is not yet active. Please contact FIKova Management to confirm your registration and request verified manual payment instructions. Your products will become visible only after Management approves and activates your account.');
      currentUser={...user};saveCurrentUser();
      applyTheme('light');showMainApp();
    },true);
  }
  function init(){
    configureSignup();
    const menu=$('#menuOverlay .menuList');
    if(menu&&!menu.querySelector('[data-feature="business"]')){
      const first=menu.querySelector('[data-feature="settings"]');
      const add=(feature,label)=>{const btn=document.createElement('button');btn.type='button';btn.className='menuItem';btn.dataset.feature=feature;btn.innerHTML='<span class="label">'+label+'</span>';menu.insertBefore(btn,first||null);btn.addEventListener('click',()=>{closeMenu();openFeature(feature);});};
      add('marketplace','Marketplace');
      add('business','My Business');
      add('business-admin','Businesses & Approvals');
    }
    featurePermissions.business=['business'];
    featurePermissions.marketplace=['client','rider','management','business'];
    featurePermissions['business-admin']=['management'];
    featurePermissions.settings.push('business');
    featurePermissions.logout.push('business');
    const originalOpenFeature=openFeature;
    openFeature=function(feature){
      if(!currentUser)return originalOpenFeature(feature);
      if(currentUser.role==='business'&&!['business','settings','logout'].includes(feature))return showBusinessFeature('business');
      if(feature==='business'&&currentUser.role==='business')return showBusinessFeature(feature);
      if(feature==='marketplace')return showBusinessFeature(feature);
      if(feature==='business-admin'&&currentUser.role==='management')return showBusinessFeature(feature);
      return originalOpenFeature(feature);
    };
    const originalShowMainApp=showMainApp;
    showMainApp=function(){
      originalShowMainApp();
      if(currentUser?.role==='business')openFeature('business');
    };
    const originalShowHome=showHome;
    showHome=function(){
      if(currentUser?.role==='business')return openFeature('business');
      return originalShowHome();
    };
    const originalRenderDatabaseView=renderDatabaseView;
    renderDatabaseView=function(container){
      originalRenderDatabaseView(container);
      if(currentUser?.role==='management'){
        const holder=document.createElement('div');container.prepend(holder);renderAdmin(holder);
      }
    };
    const originalRenderSafe=renderDatabaseSafeMode;
    renderDatabaseSafeMode=function(container){
      originalRenderSafe(container);
      if(currentUser?.role==='management'){
        const holder=document.createElement('div');container.prepend(holder);renderAdmin(holder);
      }
    };
    if(currentUser?.role==='business')openFeature('business');
    window.addEventListener('storage',event=>{
      if(![PRODUCT_KEY,MESSAGE_KEY,CONTACT_KEY,'jessin_users'].includes(event.key))return;
      if(event.key==='jessin_users'){
        try{const incoming=JSON.parse(event.newValue||'[]');if(Array.isArray(incoming))users=incoming;}catch(_){}
        if(currentUser?.role==='business'){
          const found=owner();
          if(found){currentUser={...currentUser,...found};saveCurrentUser();}
        }
      }
      if($('#fbOwnerPage'))refreshOwner();
      if($('#fbAdminView'))renderAdmin($('#fbAdminView').parentElement);
      if($('#fbMarket'))renderMarket($('#fbMarket').parentElement);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
