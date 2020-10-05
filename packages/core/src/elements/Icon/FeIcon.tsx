import React, { FC, forwardRef } from 'react';
import { IconNames, IconProps } from './interfaces';

import { omitProps } from '../../helpers';
import { SortArrows, SortArrowsAsc, SortArrowsDesc } from './svgs/SortArrows';
import { Filters } from './svgs/Filters';
import { UpArrow, DownArrow, RightArrow, LeftArrow } from './svgs/Arrows';
import { Checkmark, Indeterminate } from './svgs/Checkmark';

const mapIcons: Partial<{ [key in IconNames]: FC }> = {
  'up-arrow': UpArrow,
  'down-arrow': DownArrow,
  'right-arrow': RightArrow,
  'left-arrow': LeftArrow,
  'sort-arrows': SortArrows,
  'sort-arrows-asc': SortArrowsAsc,
  'sort-arrows-desc': SortArrowsDesc,
  checkmark: Checkmark,
  indeterminate: Indeterminate,
  filters: Filters,
};

export const FeIcon = forwardRef<HTMLElement, IconProps>((props, ref) => {
  const SelectedIcon: any = mapIcons[props.name] ?? (() => null);
  return <SelectedIcon ref={ref} {...omitProps(props, ['name'])} />;
});