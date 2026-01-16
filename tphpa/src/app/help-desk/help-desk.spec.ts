import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpDesk } from './help-desk';

describe('HelpDesk', () => {
  let component: HelpDesk;
  let fixture: ComponentFixture<HelpDesk>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpDesk]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpDesk);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
