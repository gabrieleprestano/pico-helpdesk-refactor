import { HttpClient } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { environment } from '../environments/environment';
import {
  ReplyTicketPayload,
  Ticket,
  TicketStatus,
  UpdateTicketPayload,
} from '../models/types/tickets.types';
import { Observable } from 'rxjs/internal/Observable';
import { tap } from 'rxjs/internal/operators/tap';
import { UserService } from './user.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';

import { LucideTickets } from '@lucide/angular';
import { map } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Service()
export class TicketsService {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  protected readonly apiUrl = environment.apiBaseUrl;

  params = toSignal(
    this.route.paramMap.pipe(
      map((params) => ({
        ticketId: params.get('id'),
        ticketNumber: params.get('tk'),
      })),
    ),
    { initialValue: { ticketId: null, ticketNumber: null } },
  );

  // Params
  ticketId = computed(() => this.params().ticketId);
  ticketNumber = computed(() => this.params().ticketNumber);

  // Tickets Resource
  ticketsResource = rxResource({
    stream: () => {
      return this.http
        .get<Ticket[]>(`${this.apiUrl}/tickets`, { headers: this.userService.getHeaders() })
        .pipe(tap((tickets) => console.info(console.log('Fetched tickets:', tickets))));
    },
  });

  // Tickets, Loading & Error State
  readonly isLoadingTickets = this.ticketsResource.isLoading;
  readonly ticketsErrorMessage = this.ticketsResource.error;
  readonly tickets = this.ticketsResource.value;

  // Ticket Detail Resource
  private _isPermaLink = signal<boolean>(false);
  readonly isPermaLink = this._isPermaLink.asReadonly();

  ticketResource = rxResource({
    params: () => ({ id: this.ticketId(), tk: this.ticketNumber() }),
    stream: ({ params }) => {
      const { id, tk } = params;

      if (!id) throw new Error('ID del ticket mancante.');

      if (!tk) {
        return this.getTicketById(id).pipe(
          tap(() => {
            this._isPermaLink.set(false);
          }),
        );
      }

      return this.getPermalinkTicketById(id, tk).pipe(
        tap(() => {
          this._isPermaLink.set(true);
        }),
      );
    },
  });

  // Ticket Detail, Loading & Error State
  ticket = computed(() => this.ticketResource.value());
  isLoadingTicket = computed(() => this.ticketResource.isLoading());
  ticketErrorMessage = computed(() => this.ticketResource.error());

  // Altri Stati Ticket
  private _hasClickedTicket = signal<boolean>(false);
  readonly hasClickedTicket = this._hasClickedTicket.asReadonly();

  selectTicket() {
    this._hasClickedTicket.set(true);
  }

  deselectTicket() {
    this._hasClickedTicket.set(false);
  }

  // Filtri & filteredTickets
  private readonly SCALATO = 'SCALATO' as TicketStatus;
  private readonly TUTTI = 'ALL' as TicketStatus;

  private _activeTicketStatusFilters = signal<TicketStatus[]>([this.SCALATO]);
  readonly activeTicketStatusFilters = this._activeTicketStatusFilters.asReadonly();

  readonly filtriStati = computed(() => [
    { label: 'Scalati', value: this.SCALATO },
    { label: 'Tutti', value: this.TUTTI },

    { label: 'Nuovi', value: 'NEW' as TicketStatus },
    { label: 'Aperti', value: 'OPEN' as TicketStatus },
    { label: 'In Attesa', value: 'WAITING' as TicketStatus },
    { label: 'Risolti', value: 'RESOLVED' as TicketStatus },
  ]);

  readonly filteredTickets = computed(() => {
    const filters = this.activeTicketStatusFilters();

    let filtered = this.tickets() ?? [];

    if (!filters || filters.length === 0) return filtered;

    if (!filters.includes(this.TUTTI)) {
      const hasScalatoFilter = filters.includes(this.SCALATO);
      if (hasScalatoFilter) {
        filtered = filtered.filter(
          (ticket) => ticket.escalation === true && ticket.stato !== 'RESOLVED',
        );
      }

      const selectedStatuses = filters.filter((status) => status !== this.SCALATO);
      if (selectedStatuses.length > 0) {
        filtered = filtered.filter((ticket) => selectedStatuses.includes(ticket.stato));
      }
    }
    return [...filtered].sort(
      (a, b) => new Date(b.dataAggiornamento).getTime() - new Date(a.dataAggiornamento).getTime(),
    );
  });

  // Informazioni / Statistiche
  readonly openTickets =
    computed(() => this.tickets()?.filter((ticket) => ticket.stato === 'OPEN')) || 0;
  readonly newTickets =
    computed(() => this.tickets()?.filter((ticket) => ticket.stato === 'NEW')) || 0;
  readonly waitingTickets =
    computed(() => this.tickets()?.filter((ticket) => ticket.stato === 'WAITING')) || 0;
  readonly resolvedTickets =
    computed(() => this.tickets()?.filter((ticket) => ticket.stato === 'RESOLVED')) || 0;

  readonly statistics = computed(() => [
    {
      lucideIcon: LucideTickets,
      status: 'Nuovi',
      count: this.newTickets()?.length || 0,
      color: '#22c55e',
    },
    {
      lucideIcon: LucideTickets,
      status: 'Aperti',
      count: this.openTickets()?.length || 0,
      color: '#22c55e',
    },
    {
      lucideIcon: LucideTickets,
      status: 'In attesa',
      count: this.waitingTickets()?.length || 0,
      color: '#facc15',
    },
    {
      lucideIcon: LucideTickets,
      status: 'Risolti',
      count: this.resolvedTickets()?.length || 0,
      color: '#22c55e',
    },
  ]);

  // Metodi
  toggleStatusFilter(status: TicketStatus) {
    this._activeTicketStatusFilters.update((filters) => {
      if (status === this.TUTTI) {
        return filters.includes(this.TUTTI) ? [] : [this.TUTTI];
      }

      if (status === this.SCALATO) {
        if (filters.includes(this.TUTTI)) {
          return [this.SCALATO];
        }

        return filters.includes(this.SCALATO)
          ? filters.filter((s) => s !== this.SCALATO)
          : [...filters, this.SCALATO];
      }

      const withoutAll = filters.filter((s) => s !== this.TUTTI);

      if (filters.includes(status)) {
        return withoutAll.filter((s) => s !== status);
      }

      return [...withoutAll, status];
    });
  }

  getTicketById(ticketId: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${ticketId}`, {
      headers: this.userService.getHeaders(),
    });
  }

  getPermalinkTicketById(ticketId: string, ticketNumber: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.apiUrl}/tickets/${ticketId}/${ticketNumber}`, {
      headers: this.userService.getHeaders(),
    });
  }

  patchTicket(ticketId: string, payload: UpdateTicketPayload): Observable<Ticket> {
    return this.http
      .patch<Ticket>(`${this.apiUrl}/tickets/${ticketId}`, payload, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap((ticketAggiornato) => {
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).map((t) =>
              t._id === ticketAggiornato._id ? ticketAggiornato : t,
            ),
          );

          if (this.ticketId() === ticketAggiornato._id) {
            this.ticketResource.reload();
          }
        }),
      );
  }

  replyTicket(
    ticketId: string,
    payload: ReplyTicketPayload,
  ): Observable<{ ok: boolean; ticket: Ticket }> {
    return this.http
      .post<{
        ok: boolean;
        ticket: Ticket;
      }>(`${this.apiUrl}/tickets/${ticketId}/reply`, payload, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap((resultPayload) => {
          const ticketAggiornato = resultPayload.ticket;
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).map((t) =>
              t._id === ticketAggiornato._id ? ticketAggiornato : t,
            ),
          );

          if (this.ticketId() === ticketAggiornato._id) {
            this.ticketResource.reload();
          }
        }),
      );
  }

  deleteTicket(ticketId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/tickets/${ticketId}`, {
        headers: this.userService.getHeaders(),
      })
      .pipe(
        tap(() => {
          this.tickets.update((ticketsAttuali) =>
            (ticketsAttuali ?? []).filter((t) => t._id !== ticketId),
          );

          if (this.ticketId() === ticketId) {
            this.ticketResource.reload();
          }
        }),
      );
  }
}
