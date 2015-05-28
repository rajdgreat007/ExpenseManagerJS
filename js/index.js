var expenseManager = (function(){
    var privateVars = {
        expenseKey : 'expense',
        friendsKey : 'friend',
        otherBrowserExpenseStore : [],
        otherBrowserFriendStore : [],
        localStorageSupport : typeof(Storage) == "function",
        cache :{
            chooseFriends : document.getElementById('chooseFriends'),
            addFriendButton : document.getElementById('addFriendButton'),
            newFriend : document.getElementById('newFriend'),
            message : document.getElementById('message'),
            showExpenses : document.getElementById('showExpenses'),
            expenseDescription : document.getElementById('expenseDescription'),
            expenseAmount : document.getElementById('expenseAmount'),
            addExpenseButton : document.getElementById('addExpenseButton')
        },
        expenseId : 0,
        currentEditId : null
    };
    var privateFunctions = {
        setLocalStorageWrappers : function(){
            if (privateVars.localStorageSupport) {
                Storage.prototype.setObject = function (key, value) {
                    this.setItem(key, JSON.stringify(value));
                };
                Storage.prototype.getObject = function (key) {
                    var value = this.getItem(key);
                    return value && JSON.parse(value);
                };
            }
        },
        getExpenseStorage : function(){
            if(privateVars.localStorageSupport){
                return localStorage.getObject(privateVars.expenseKey)||[];
            }else return privateVars.otherBrowserExpenseStore;
        },
        getFriendsStorage : function(){
            if(privateVars.localStorageSupport){
                return localStorage.getObject(privateVars.friendsKey)||[];
            }else return privateVars.otherBrowserFriendStore;
        },
        saveFriend : function(fs,friend){
            fs.push(friend);
            if(privateVars.localStorageSupport){
                localStorage.setObject(privateVars.friendsKey, fs);
            }
            this.populateSelect(friend);
        },
        saveExpense : function(es,expense){
            if(privateVars.currentEditId!==null){
                expense.id= privateVars.currentEditId;
                es[privateVars.currentEditId] = expense;
                if(privateVars.localStorageSupport){
                    localStorage.setObject(privateVars.expenseKey, es);
                }
                this.editTableRow(expense);
                privateVars.currentEditId = null;
            }else{
                expense.id = privateVars.expenseId++;
                es.push(expense);
                if(privateVars.localStorageSupport){
                    localStorage.setObject(privateVars.expenseKey, es);
                }
                this.populateExpense(expense);
            }
        },
        populateSelect : function(friend){
                var option=document.createElement('option');
                option.value=friend;
                option.text=friend;
                privateVars.cache.chooseFriends.appendChild(option);
        },
        populateExpense : function(expense){
            var tbody = privateVars.cache.showExpenses.getElementsByTagName('tbody')[0];
            var numRows = tbody.rows.length;
            var row = tbody.insertRow(numRows);
            var j=0;
            for(var i in expense){
                if(expense.hasOwnProperty(i) && i!=='id'){
                    row.insertCell(j).innerHTML = expense[i];
                    j++;
                }
            }
            var ebtn = document.createElement('button');
            ebtn.setAttribute('id','exp'+expense.id);
            ebtn.setAttribute('class','editBtn');
            ebtn.innerHTML='edit';
            row.insertCell(j).appendChild(ebtn);

            var dbtn = document.createElement('button');
            dbtn.setAttribute('id','exp'+expense.id);
            dbtn.setAttribute('class','delBtn');
            dbtn.innerHTML='delete';
            row.insertCell(j+1).appendChild(dbtn);
        },
        editTableRow : function(expense){
            var tbody = privateVars.cache.showExpenses.getElementsByTagName('tbody')[0];
            var numRows = tbody.rows.length;
            for(var i=0;i<numRows;i++){
                var row = tbody.rows[i];
                if(row.cells[3].childNodes[0].getAttribute('id').replace('exp','')==expense.id){
                    row.cells[0].innerHTML = expense.expenseDescription;
                    row.cells[1].innerHTML = expense.expenseAmount;
                    row.cells[2].innerHTML = expense.chooseFriends.join(',');
                }
            }

        },
        deleteTableRow : function(id){
            var tbody = privateVars.cache.showExpenses.getElementsByTagName('tbody')[0];
            var numRows = tbody.rows.length;
            var toBeDeletedRow = null;
            for(var i=0;i<numRows;i++){
                var row = tbody.rows[i];
                if(row.cells[3].childNodes[0].getAttribute('id').replace('exp','')==id){
                    toBeDeletedRow = row;
                }
            }
            if(toBeDeletedRow==null) {
                /*console.log('Row not found')*/
            }
            else{
                tbody.removeChild(toBeDeletedRow);
            }
        },
        addListener : function(elem,event,fn){
            if (elem.addEventListener) {
                elem.addEventListener(event, fn, false);
            } else {
                elem.attachEvent("on" + event, function() {
                    return(fn.call(elem, window.event));
                });
            }
        },
        disappearMessage : function(){
            setTimeout((function(m){
                return function(){
                    m.innerHTML = '';
                }
            })(privateVars.cache.message),3000)
        },
        populateDataFromLocalStorage : function(){
            var fs = this.getFriendsStorage();
            var es = this.getExpenseStorage();
            for(var f=0;f<fs.length;f++){
                this.populateSelect(fs[f]);
            }
            for(var e=0;e<es.length;e++){
                this.populateExpense(es[e]);
                privateVars.expenseId = e+1;
            }
        },
        getAllValuesFromMultiSelect : function(select){
            var result = [];
            var options = select && select.options;
            var opt;
            for (var i=0, iLen=options.length; i<iLen; i++) {
                opt = options[i];
                if (opt.selected) {
                    result.push(opt.value);
                }
            }
            return result;
        },
        clearAllValuesMultiSelect : function(){
            var opt = privateVars.cache.chooseFriends.options;
            for(var i=0;i<opt.length;i++){
              opt[i].selected = false;
            }
        },
        fillExpense : function(id){
            var es = this.getExpenseStorage();
            var expense = null;
            for(var i=0;i<es.length;i++){
                if(es[i].id==id) expense = es[i];
            }
            if(expense==null) {
                //console.log('Expense object not found');
            }
            else{
                privateVars.cache.expenseDescription.value = expense.expenseDescription;
                privateVars.cache.expenseAmount.value = expense.expenseAmount;
                privateFunctions.clearAllValuesMultiSelect();
                for ( var x = 0, l = privateVars.cache.chooseFriends.options.length, o; x < l; x++ ) {
                    o = privateVars.cache.chooseFriends.options[x];
                    if ( privateFunctions.getArrayIndex(expense.chooseFriends, o.text) != -1 ){
                        o.selected = true;
                    }
                }
                privateVars.currentEditId = id;
            }
        },
        deleteExpense : function(id){
            var es = this.getExpenseStorage();
            var expense = null;
            for(var i=0;i<es.length;i++){
                if(es[i].id==id) expense = es[i];
            }
            if(expense==null) {
                //console.log('Expense object not found');
            }
            else{
                es.splice(id,1);
                if(privateVars.localStorageSupport){
                    localStorage.setObject(privateVars.expenseKey, es);
                }
                this.deleteTableRow(id);
            }
        },
        getArrayIndex : function(arr,item){
            for(var i=0;i<arr.length;i++){
                if(arr[i]==item){
                    return i;
                }
            }
            return -1;
        }

    };
    return {
        init : function(){
            privateFunctions.setLocalStorageWrappers();
            this.bindEvents();
            privateFunctions.populateDataFromLocalStorage();
        },
        addFriend : function(friend){
            if(friend=='') {
                privateVars.cache.message.innerHTML='Friend name cannot be empty';
            }else{
                var fs = privateFunctions.getFriendsStorage();
                if(privateFunctions.getArrayIndex(fs,friend)==-1) {
                    privateFunctions.saveFriend(fs,friend);
                    privateVars.cache.newFriend.value='';
                    privateVars.cache.message.innerHTML='Friend added Successfully!';
                }else{
                    privateVars.cache.message.innerHTML='Friend Already Added!';
                }
            }
            privateFunctions.disappearMessage();
        },
        addExpense : function(expense){
            if(expense.expenseDescription==''||expense.expenseAmount==''||isNaN(expense.expenseAmount)||
                expense.chooseFriends.length==0){
                privateVars.cache.message.innerHTML='Please fill all fields';
            }else{
                var es = privateFunctions.getExpenseStorage();
                privateFunctions.saveExpense(es,expense);
                privateVars.cache.expenseDescription.value='';
                privateVars.cache.expenseAmount.value='';
                privateFunctions.clearAllValuesMultiSelect();
                privateVars.cache.message.innerHTML='Expense saved Successfully!';
            }
            privateFunctions.disappearMessage();
        },
        bindEvents : function(){
            var self = this;
            privateFunctions.addListener(privateVars.cache.addFriendButton,'click', function(){
                self.addFriend(privateVars.cache.newFriend.value);
            });
            privateFunctions.addListener(privateVars.cache.addExpenseButton,'click', function(){
                self.addExpense({
                    expenseDescription:privateVars.cache.expenseDescription.value,
                    expenseAmount: privateVars.cache.expenseAmount.value,
                    chooseFriends:privateFunctions.getAllValuesFromMultiSelect(privateVars.cache.chooseFriends)
                });
            });
            privateFunctions.addListener(privateVars.cache.showExpenses,'click', function(event){
                event = event||window.event;
                var target = event.target || event.srcElement;
                if(target.nodeName=='BUTTON'){
                    var id = target.getAttribute('id').replace('exp','');
                    if(target.className=="editBtn"){
                        privateFunctions.fillExpense(id);
                    }else if(target.className=="delBtn"){
                        var confirm= window.confirm('This will delete the entry. Are you sure?');
                        if(confirm){
                            privateFunctions.deleteExpense(id);
                        }
                    }
                }
            });
        }
    }
})();

window.onload = function(){
  expenseManager.init();
};