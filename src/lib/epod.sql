-- Create ePOD table
create table public.epods (
    id uuid primary key default gen_random_uuid(),
    load_id uuid references public.loads(id) on delete cascade not null,
    carrier_id uuid references public.carriers(id) not null,
    recipient_name text not null,
    delivery_notes text,
    signature_data text not null, -- base64 image
    delivery_timestamp timestamptz default now() not null,
    delivery_location text not null,
    created_at timestamptz default now() not null
);

-- RLS
alter table public.epods enable row level security;

-- Policies
create policy "Admins can manage all ePODs" on public.epods for all to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "Carriers can create and view own ePODs" on public.epods 
    for select to authenticated 
    using (exists (select 1 from public.carriers c where c.portal_user_id = auth.uid() and c.id = epods.carrier_id));

create policy "Carriers can insert own ePODs" on public.epods 
    for insert to authenticated 
    with check (exists (select 1 from public.carriers c where c.portal_user_id = auth.uid() and c.id = epods.carrier_id));

create policy "Shippers can view ePODs for their loads" on public.epods 
    for select to authenticated 
    using (exists (select 1 from public.loads l join public.shippers s on l.shipper_id = s.id where l.id = epods.load_id and s.portal_user_id = auth.uid()));

-- Grants
grant select, insert on public.epods to authenticated;
grant all on public.epods to service_role;
