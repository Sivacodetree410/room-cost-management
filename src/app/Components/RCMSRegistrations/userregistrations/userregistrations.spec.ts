import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Userregistrations } from './userregistrations';

describe('Userregistrations', () => {
  let component: Userregistrations;
  let fixture: ComponentFixture<Userregistrations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Userregistrations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Userregistrations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
