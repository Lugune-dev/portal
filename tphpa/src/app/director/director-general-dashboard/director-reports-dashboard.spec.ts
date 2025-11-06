import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DirectorReportsDashboardComponent } from './director-reports-dashboard';

describe('DirectorReportsDashboardComponent', () => {
  let component: DirectorReportsDashboardComponent;
  let fixture: ComponentFixture<DirectorReportsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DirectorReportsDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DirectorReportsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
