import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicFormComponent } from './dynamic-forms'; // <-- Corrected import

describe('DynamicFormComponent', () => { // <-- Corrected describe block
  let component: DynamicFormComponent; // <-- Corrected variable type
  let fixture: ComponentFixture<DynamicFormComponent>; // <-- Corrected fixture type

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent] // <-- Corrected import
    })
    .compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent); // <-- Corrected createComponent
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});