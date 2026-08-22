-- Create vehicles table
create table public.vehicles (
    id uuid primary key default gen_random_uuid(),
    carrier_id uuid references public.carriers(id) on delete cascade not null,
    vehicle_id_tag text not null,
    vehicle_type text not null, -- Dry Van, Reefer, etc.
    make text,
    model text,
    year integer,
    license_plate text,
    vin text,
    capacity_lbs integer,
    assigned_driver_id uuid references public.drivers(id) on delete set null,
    status text not null default 'available', -- available, assigned, in_transit, maintenance, inactive
    created_at timestamp with time zone default now() not null,
    updated_at timestamp with time zone default now() not null
);

-- Add vehicle_id to loads
alter table public.loads add column vehicle_id uuid references public.vehicles(id) on delete set null;

-- Grants
grant select, insert, update, delete on public.vehicles to authenticated;
grant all on public.vehicles to service_role;

-- Enable RLS
alter table public.vehicles enable row level security;

-- Policies for vehicles
create policy "Admins can do everything on vehicles"
on public.vehicles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Carriers can view their own vehicles"
on public.vehicles
for select
to authenticated
using (
    carrier_id in (select id from public.carriers where portal_user_id = auth.uid())
);

create policy "Carriers can update their own vehicles"
on public.vehicles
for update
to authenticated
using (
    carrier_id in (select id from public.carriers where portal_user_id = auth.uid())
)
with check (
    carrier_id in (select id from public.carriers where portal_user_id = auth.uid())
);

create policy "Carriers can insert their own vehicles"
on public.vehicles
for insert
to authenticated
with check (
    carrier_id in (select id from public.carriers where portal_user_id = auth.uid())
);

create policy "Shippers can view vehicles assigned to their loads"
on public.vehicles
for select
to authenticated
using (
    exists (
        select 1 from public.loads l
        join public.shippers s on l.shipper_id = s.id
        where l.vehicle_id = public.vehicles.id
        and s.portal_user_id = auth.uid()
    )
);
