import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthService } from './auth';

describe('Auth', () => {
  let component: AuthService;
  let fixture: ComponentFixture<AuthService>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthService]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthService);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
