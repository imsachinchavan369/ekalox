alter table public.products
  add column if not exists price_amount numeric(12, 2) not null default 0 check (price_amount >= 0),
  add column if not exists price_currency char(3) not null default 'INR' check (price_currency in ('INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD'));

update public.products
set
  price_amount = round((price_cents::numeric / 100), 2),
  price_currency = currency_code
where price_amount = 0
  and price_cents > 0;

alter table public.products
  alter column currency_code set default 'INR';

alter table public.products
  drop constraint if exists products_free_must_be_zero_price_amount;

alter table public.products
  add constraint products_free_must_be_zero_price_amount
    check (cta_type <> 'free' or price_amount = 0);
