import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Ticket } from '../../models/types/tickets.types';
import { TicketsService } from '../../services/tickets.service';

@Component({
  selector: 'app-ticket-card',
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './ticket-card.html',
  styleUrl: './ticket-card.css',
})
export class TicketCard {
  private ticketsService = inject(TicketsService);
  ticket = input.required<Ticket>();

  ticketsStatesConfiguration: Record<string, { background: string; label: string }> = {
    OPEN: { background: '#22c55e', label: 'Aperto' },
    NEW: { background: '#2563eb', label: 'Nuovo' },
    WAITING: { background: '#facc15', label: 'In Attesa' },
    RESOLVED: { background: '#9ca3af', label: 'Risolto' },
  };

  selectTicket() {
    this.ticketsService.selectTicket();
  }
}
