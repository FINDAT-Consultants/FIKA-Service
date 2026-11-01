/* Add the Business role without changing existing Client/Rider/Management account data. */
(function(){
  function addBusiness(){
    const pick=document.getElementById('signupRolePick');
    if(pick&&!pick.querySelector('[data-role="business"]')){
      const button=document.createElement('button');
      button.type='button';button.className='roleOption';button.dataset.role='business';
      button.setAttribute('aria-selected','false');button.title='Register as a FIKova Business';
      button.innerHTML='<i class="fa-solid fa-store"></i><span>Business</span>';
      pick.insertBefore(button,pick.querySelector('[data-role="management"]')||null);
      button.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();location.href='business-portal.html?mode=register';});
    }
    const loginRole=document.getElementById('loginRole');
    if(loginRole&&!loginRole.querySelector('[value="business"]')){
      const option=document.createElement('option');option.value='business';option.textContent='Business';
      loginRole.appendChild(option);
    }
    const loginBtn=document.getElementById('loginBtn');
    if(loginBtn&&!loginBtn.dataset.fikovaBusinessRoute){
      loginBtn.dataset.fikovaBusinessRoute='1';
      loginBtn.addEventListener('click',e=>{
        if(loginRole?.value!=='business')return;
        e.preventDefault();e.stopImmediatePropagation();
        location.href='business-portal.html?mode=login';
      },true);
    }
    const footerLinks=Array.from(document.querySelectorAll('.footerLinks a'));
    footerLinks.filter(a=>a.textContent.trim()==='Fikova Business').forEach(a=>a.href='business-portal.html?mode=register');
    const menu=document.querySelector('#menuOverlay .menuList');
    if(menu&&!menu.querySelector('#fikovaBusinessManagement')){
      const btn=document.createElement('button');btn.type='button';btn.className='menuItem';btn.id='fikovaBusinessManagement';
      btn.innerHTML='<span class="label">Businesses & approvals</span><span class="badge">Management</span>';
      btn.hidden=true;btn.addEventListener('click',()=>{location.href='business-portal.html?mode=management';});
      menu.insertBefore(btn,menu.querySelector('[data-feature="settings"]'));
      const observer=new MutationObserver(()=>{
        const role=window.currentUser?.role;
        const menuUser=document.getElementById('menuUserRole')?.textContent.trim().toLowerCase();
        btn.hidden=!(role==='management'||menuUser==='management');
      });
      const roleEl=document.getElementById('menuUserRole');
      if(roleEl)observer.observe(roleEl,{characterData:true,childList:true,subtree:true});
      btn.hidden=(roleEl?.textContent.trim().toLowerCase()!=='management');
    }
    const styles=document.createElement('style');
    styles.textContent='@media(max-width:600px){#signupRolePick{flex-wrap:wrap}#signupRolePick .roleOption{flex:1 1 calc(50% - 5px);min-width:0;font-size:10px;min-height:38px}}';
    document.head.appendChild(styles);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addBusiness,{once:true});
  else addBusiness();
})();