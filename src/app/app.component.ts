import { AsyncPipe } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, buffer, bufferTime, combineLatest, debounceTime, filter, map, Observable, of, startWith, Subject, switchMap, tap, throttleTime } from 'rxjs';


type Day = {
  dayName: string,
  dayNum: number
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements AfterViewInit {
  title = 'storeManagement';

  count = new BehaviorSubject<number>(1);
  doubleCount = this.count.pipe(
    switchMap((value) => {
      return [value * 2]
    })
  )

  clickCount = new BehaviorSubject<number>(0);

  clickEventSubject = new Subject<MouseEvent>();
  resetClickCount = this.clickEventSubject.pipe(
    debounceTime(300),
    tap(() => {
      this.clickCount.next(0);
    })
  )

  checkClickCount = this.clickCount.pipe(
    switchMap((val) => {
      if (val > 1) {
        return of(this.update());
      }
      return of(null)
    })
  )


  checkForDoubleClick(event: MouseEvent) {
    let newVal = this.clickCount.getValue() + 1;
    this.clickCount.next(newVal);
    this.clickEventSubject.next(event)
  }

  update() {
    let newValue = this.count.getValue() + 1;
    this.count.next(newValue);
  }

  cdr = inject(ChangeDetectorRef);

  @ViewChild('date', { static: true }) date!: ElementRef;
  @ViewChild('weekSelect', { static: true }) weekSelect!: ElementRef;
  ngAfterViewInit(): void {
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;

    let event = {
      target: {
        value: `${year} - ${month.toString().padStart(2, "0")}`
      }
    }

    this.selectMonth(event);
    if (this.date) {
      this.date.nativeElement.value = new Date(event.target.value);
    }
    this.cdr.detectChanges();
  }

  getMonth = new Subject<Date>();
  week = new BehaviorSubject<number>(0);

  resetWeek = this.getMonth.pipe(tap(month => {
    this.week.next(0);
    if (this.weekSelect) {
      this.weekSelect.nativeElement.value = "0"
    }
  }));


  monthData$: Observable<Array<Day>> = combineLatest([
    this.getMonth,
    this.week
  ]).pipe(
    switchMap(([date, week]) => {
      let [year, month] = date.toString().split('-');
      let lastDay = new Date(Number(year), Number(month), 0).getDate();
      let firstDay = new Date(Number(year), Number(month) - 1, 1).getDay();
      let days: Array<Day> = [];
      let firstDayOfWeek = (firstDay + 6) % 7; //starts with monday

      let prevMonthLastDay = new Date(Number(year), Number(month) - 1, 0).getDate()
      let prevMonthDays: Array<Day> = []
      for (let i = 1; i <= prevMonthLastDay; i++) {

        let dayName = new Date(Number(year), Number(month) - 2, i).toLocaleDateString('en-Us', { weekday: 'long' });
        prevMonthDays.push({
          dayNum: i,
          dayName: dayName
        });
      }

      let remainingDays = prevMonthDays.slice(prevMonthLastDay - firstDayOfWeek);

      if (Number(week) !== 0) {
        days.unshift(...remainingDays);
        for (let i = 1; i <= lastDay; i++) {
          let dayName = new Date(Number(year), Number(month) - 1, i).toLocaleDateString('en-US', { weekday: 'long' });
          days.push({
            dayNum: i,
            dayName: dayName
          });
        }

        let offset = (week - 1) * 7;

        let offsetDays = days.slice(offset, offset + 7);

        if (week == 5) {
          offsetDays = days.slice(offset, offset + 10)
        }

        return of(offsetDays);
      }

      for (let i = 1; i <= lastDay; i++) {
        let dayName = new Date(Number(year), Number(month) - 1, i).toLocaleDateString('en-US', { weekday: 'long' });
        days.push({
          dayNum: i,
          dayName: dayName
        });
      }

      return of(days);
    })
  );
  selectMonth(event: any) {
    this.getMonth.next(event.target.value)
  }

  selectWeek(event: any) {
    this.week.next(event.target.value);
  }
}
