alter table public.architectural_plan_elements
  drop constraint if exists architectural_plan_elements_element_type_check;

alter table public.architectural_plan_elements
  add constraint architectural_plan_elements_element_type_check
  check (
    element_type = any (
      array[
        'wall'::text,
        'opening'::text,
        'door'::text,
        'window'::text,
        'room'::text,
        'stair'::text,
        'column'::text,
        'shaft'::text,
        'label'::text,
        'dimension'::text
      ]
    )
  );
