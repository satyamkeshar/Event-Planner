import { api, track,wire, LightningElement } from 'lwc';
import initializer from '@salesforce/apex/CalendarInitializer.initializer';
import acclist from '@salesforce/apex/calendarMethods.acclist';
import accountsWithParameters from '@salesforce/apex/calendarMethods.acclistWithParameter';
import createAccountRecord from '@salesforce/apex/calendarMethods.createAccountRecord';
import getUsersList from '@salesforce/apex/calendarMethods.getUsersList';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const monthMap = new Map([
['January', 'Jan'],
['February', 'Feb'],
['March', 'Mar'],
['April', 'Apr'],
['May', 'May'],
['June', 'Jun'],
['July', 'Jul'],
['August', 'Aug'],
['September', 'Sep'],
['October', 'Oct'],
['November', 'Nov'],
['December', 'Dec']
]);

const monthMapDate = new Map([
['January', '01'],
['February', '02'],
['March', '03'],
['April', '04'],
['May', '05'],
['June', '06'],
['July', '07'],
['August', '08'],
['September', '09'],
['October', '10'],
['November', '11'],
['December', '12']
]);
export default class calendar extends LightningElement {


    SelectedListValue = 'Account';
    get options() {
        return [
            { label: 'Account', value: 'Account' },
            { label: 'Lead', value: 'Lead' },
            { label: 'Beat/Route', value: 'Beat/Route' },
        ];
    }

   @track SelectedUser;
   @track userOptions = [];
   @api
   get earliestStartPermitted() {
       const today = new Date();
       const yyyy = today.getFullYear();
       const mm = String(today.getMonth() + 1).padStart(2, '0'); 
       const dd = String(today.getDate()).padStart(2, '0');
       return `${yyyy}-${mm}-${dd}`;
   }
   
@api arrivalWindowStart = "";
monthMap = monthMap;

isLoading = false;
@track monthName;

@track calendarDays = [];
@track apexData;

@track selectedDay;
@track monthsToAdvance = 0;
year;
weekName = '';
@track globalSlot;

@track searchedAccount;
confStartTime;
confEndTime;
confDate;
confworkType;
confPhone;
conEmail;
confname;
localStart;
localEnd;
draggedAccountId;
initializerData;

@track listEvent = [{
    name : "event 1",
    id: "3712674543827"
}]


        
handleSelectedList(event) {
    this.SelectedListValue = event.detail.value;
   // console.log('SelectListValue:===>' + this.SelectedListValue);
    this.getAccounts();
}

handleSelectedUser(event) {
    this.SelectedUser = event.detail.value;
    this.initializeData();
    console.log('userOptions:==>' + JSON.stringify(this.userOptions));
}

getAccounts() {
    acclist({ selectedValue: this.SelectedListValue })
        .then(data => {
            this.listEvent = data.map(account => ({
                name: account.Name,
                id: account.Id
            }));
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

@wire(getUsersList)
wiredUsers({ error, data }) {
    if (data) {
        this.userOptions = data.map(user => {
            return { label: user.Name, value: user.Name };
        });
    } else if (error) {
        // Handle error
        console.error(error);
    }
}

@wire(acclist, { selectedValue: '$SelectedListValue' })
accounts({ error, data }) {
    if (data) {
        this.listEvent = [];
            this.listEvent = [
            ...this.listEvent,
            ...data.map(account => ({
                name: account.Name,
                id: account.Id
            }))
        ];
        //console.log('Accounts data:::::::::', listEvent);
    } else if (error) {
        console.error('Error:', error);
    }
}


handleSearch(event)
{
    this.searchedAccount = event.target.value;
    console.log('searchedAccount=====' + this.searchedAccount);
    accountsWithParameters({ n : this.searchedAccount, selectedValue: this.SelectedListValue })
    .then(data => {
        console.log('filtered data=========>' +data);
        if (data) {

            this.listEvent = [];
            this.listEvent = [
                ...this.listEvent,
                ...data.map(account => ({
                    name: account.Name,
                    id: account.Id
                }))
            ];
            //console.log('listEvent===========>' + this.listEvent);
        }

    })
    .catch(error => {
        console.log('Error fetching accounts:' + error);
    });



}


// //initializer function
// connectedCallback() {
//     this.isLoading = true;
//     console.log('Earliest Start Permitted: ' + this.earliestStartPermitted);
//     //  this.retrieveServiceOrder();
//     // this.startingDayOfWeek = 0; 
//     initializer({ earliestDate : this.earliestStartPermitted, userName:this.SelectedUser })
//     .then(data => {
//         console.log('Initailizer data' +data);
//         this.initializerData = data;
//         this.isLoading = false;
//         if (data) {
//             this.apexData = JSON.parse(data);
//             let result = this.apexData.calendarMonths[0];
//             this.monthName = result.MonthName;
//             this.year = result.yearName;
//             this.calendarDays = result.calendarDays;
//             for (let i = 0; this.calendarDays.length > i; i++) {
//                 if (this.calendarDays[i].dayNumber != null && this.calendarDays[i].dayNumber != '') {
//                     this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: pointer; border: 2px solid transparent; background-color: #e0e0e0;";
//                     if (!this.calendarDays[i].isEnabled) {
//                         //this.calendarDays[i].blockStyle = "background-color: #717272; ";
//                         console.log('camehere')
//                         this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: not-allowed;; border: 2px solid transparent; background-color: #717272;";
//                     }
//                 }
//             }
//         }
//     })
//     .catch(error => {
//         this.isLoading = false;
//         console.log(error);
//     });
// }
connectedCallback() {
    this.initializeData();
}

initializeData() {
    this.isLoading = true;
    console.log('Earliest Start Permitted: ' + this.earliestStartPermitted);
    
    initializer({ earliestDate: this.earliestStartPermitted, userName: this.SelectedUser })
        .then(data => {
            console.log('Initializer data: ' + data);
            this.initializerData = data;
            this.isLoading = false;
            if (data) {
                this.apexData = JSON.parse(data);
                let result = this.apexData.calendarMonths[0];
                this.monthName = result.MonthName;
                this.year = result.yearName;
                this.calendarDays = result.calendarDays;
                for (let i = 0; this.calendarDays.length > i; i++) {
                    if (this.calendarDays[i].dayNumber != null && this.calendarDays[i].dayNumber != '') {
                        this.calendarDays[i].blockStyle = "padding: 6px; font-size: 16px; text-align: center; border-radius: 8px; font-weight: bold; cursor: pointer; border: 2px solid transparent; background-color: #e0e0e0;";
                        if (!this.calendarDays[i].isEnabled) {
                            console.log('came here');
                            this.calendarDays[i].blockStyle = "padding: 6px; font-size: 16px; text-align: center; border-radius: 8px; font-weight: bold; cursor: not-allowed; border: 2px solid transparent; background-color: #717272;";
                        }
                    }
                }
            }
        })
        .catch(error => {
            this.isLoading = false;
            console.error(error);
        });
}

handleDayClick(event) {
    let index = event.target.dataset.index;
    let day = event.target.dataset.day;
    console.log(index)
    console.log(day)
}


convertTo12HourFormat(inputTimeString) {
    const [hours, minutes] = inputTimeString.match(/\d+/g).map(Number);
    // Convert to 12-hour format
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    // Create the formatted time string
    const formattedTime = `${hours12}:${minutes < 10 ? "0" : ""}${minutes} ${period}`;
    return formattedTime;
}

toastEvent(type, title, message) {
    const evt = new ShowToastEvent({
        title: title,
        message: message,
        variant: type
    });
    this.dispatchEvent(evt);
}

getMonthName(monthIndex) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthIndex];
}

getWeekName(monthIndex) {
    const weekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekNames[monthIndex];
}

cantGoForward = false;
index = 0;
handleNextMonthClick() {
    
    console.log('this.apexData.calendarMonths.length=== '+this.apexData.calendarMonths.length);
    if(this.index <  this.apexData.calendarMonths.length){
        this.index = this.index + 1;
        let result = this.apexData.calendarMonths[this.index];
        this.monthName = result.MonthName;
        this.year = result.yearName;
        this.calendarDays = result.calendarDays;
        for (let i = 0; this.calendarDays.length > i; i++) {
            if (this.calendarDays[i].dayNumber != null && this.calendarDays[i].dayNumber != '') {
                this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: pointer; border: 2px solid transparent; background-color: #e0e0e0;";
                if (!this.calendarDays[i].isEnabled) {
                    //this.calendarDays[i].blockStyle = "background-color: #717272; ";
                    this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: not-allowed;; border: 2px solid transparent; background-color: #717272;";
                }
            }
        }
        this.canGoBack = true;
        console.log(this.index);
    }
    if(this.index === (this.apexData.calendarMonths.length-1)){
        console.log('inside  '+this.index);
        this.canGoBack = true;
        this.cantGoForward = true;
    }
}


canGoBack = false;
handlePreviousMonthClick() {
    
    if (this.index > 0) {
        this.index = this.index - 1;
        let result = this.apexData.calendarMonths[this.index];
        this.monthName = result.MonthName;
        this.year = result.yearName;
        this.calendarDays = result.calendarDays;
        for (let i = 0; this.calendarDays.length > i; i++) {
            if (this.calendarDays[i].dayNumber != null && this.calendarDays[i].dayNumber != '') {
                this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: pointer; border: 2px solid transparent; background-color: #e0e0e0;";
                if (!this.calendarDays[i].isEnabled) {
                    //this.calendarDays[i].blockStyle = "background-color: #717272; ";
                    this.calendarDays[i].blockStyle = "padding: 6px;font-size: 16px; text-align: center; border-radius: 8px;  font-weight: bold;cursor: not-allowed; border: 2px solid transparent; background-color: #7e9191;";
                }
            }
        }
        this.cantGoForward = false;
        console.log(this.index);
    }
    if (this.index == 0) {
        this.canGoBack = false;
        this.cantGoForward = false;
    }
}

convertDateFormat(originalDate) {
    let dateParts = originalDate.split('-');
    let formattedDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;
    return formattedDate;
}


APHandleDragStart(event) {
    let objTfData = { name : event.target.dataset.name, type : 'add' };
    console.log('Dragged account::'+JSON.stringify(objTfData));
    event.dataTransfer.setData('text/plain', JSON.stringify(objTfData) );
}

APHandleDrop(event) {
    
    event.preventDefault();
    let index = event.target.dataset.index;
    let day = event.target.dataset.day;
    let isEnanbled = this.calendarDays[index].isEnabled;
    console.log('isEnabled=====>' +JSON.stringify(isEnanbled ));
    // let month = event.target.dataset.month;
    // let year = event.target.dataset.year; 
    console.log('calendardays======> ' + JSON.stringify(this.calendarDays));
    const transferData = JSON.parse(event.dataTransfer.getData('text/plain'));
    // console.log('transferData -- '+event.dataTransfer.getData('text/plain'));
     console.log('index -- '+index);
    // console.log('day -- '+day);
    // console.log('month--' +this.monthName );
    // console.log('year -- '+this.year);

    let monthName = this.monthName;
    let year = this.year;
    let month = monthMapDate.get(monthName);
    day = day.toString().padStart(2, '0');
    let formattedDate = `${year}-${month}-${day}`;
    
    let dateTobePassed = new Date(this.formattedDate);

    console.log('Formatted Date -- ' + formattedDate);
    
    this.draggedAccountId = transferData.name;
    console.log('draggedAccountId -- '+this.draggedAccountId);
    //console.log('SelectListValue:===>' + this.SelectedListValue);
    const eventDetail = this.listEvent.find(event => event.id === this.draggedAccountId);
    const accountName = eventDetail ? eventDetail.name : 'Unknown Account'; 


    createAccountRecord({ NewAccId : this.draggedAccountId , assingedDate: formattedDate, selectedList: this.SelectedListValue, ownerName: this.SelectedUser })
    .then(data => {
        //console.log('filtered data=========>' +data);
        if (data) {
            console.log('createRecord function::'+ data);
            
            const newEvent = {
                strDate: formattedDate,
                startTime: null,
                name: accountName, 
                isAllDay: null,
                endTime: null
            };
           
                this.calendarDays[index].listEvent.push(newEvent);
    
        }
    })
    .catch(error => {
        console.log('Insertion Failed:' + error);
    });
    
    console.log('Updated calendarDays: ', JSON.stringify(this.calendarDays));
      
}
APHandleDragOver(event) {
    event.preventDefault();
}


}