import { Component, inject, signal } from '@angular/core';
import { Container } from '../../layout/container/container';
import { TicketsService } from '../../services/tickets.service';
import { CommonModule } from '@angular/common';
import { TicketStatus } from '../../models/types/tickets.types';
import { RouterModule, RouterOutlet } from '@angular/router';
import { Header } from '../../core/header/header';
import { TicketCard } from '../../shared/ticket-card/ticket-card';
import { TicketSkeletonCard } from '../../shared/ticket-skeleton-card/ticket-skeleton-card';
import { TicketSkeletonDetail } from '../../shared/ticket-skeleton-detail/ticket-skeleton-detail';

@Component({
  selector: 'app-tickets',
  imports: [
    Container,
    CommonModule,
    RouterOutlet,
    Header,
    RouterModule,
    TicketCard,
    TicketSkeletonCard,
    TicketSkeletonDetail,
  ],
  templateUrl: './tickets.html',
  styleUrl: './tickets.css',
})
export class Tickets {
  private ticketsService = inject(TicketsService);

  tickets = this.ticketsService.filteredTickets;
  isLoading = this.ticketsService.isLoadingTickets;
  error = this.ticketsService.ticketsErrorMessage;

  statistics = this.ticketsService.statistics;
  filters = this.ticketsService.filtriStati;

  hasClickedTicket = this.ticketsService.hasClickedTicket;

  deselectTicket() {
    this.ticketsService.deselectTicket();
  }

  toggleStatusFilter(status: TicketStatus) {
    this.ticketsService.toggleStatusFilter(status);
  }

  isSelectedStatus(status: TicketStatus) {
    return this.ticketsService.activeTicketStatusFilters().includes(status);
  }
}
