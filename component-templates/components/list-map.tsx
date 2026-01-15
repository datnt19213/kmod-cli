import React from 'react';

interface ListProps<T> {
  items: T[];
  keyExtractor: (item: T) => React.Key;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function List<T>({ items, keyExtractor, renderItem }: ListProps<T>) {
  return (
    <>
      {items.map((item, index) => (
        <ListItem
          key={keyExtractor(item)}
          item={item}
          index={index}
          renderItem={renderItem}
        />
      ))}
    </>
  );
}

interface ListItemProps<T> {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

// Generic memo component
function _ListItem<T>({ item, index, renderItem }: ListItemProps<T>) {
  return <>{renderItem(item, index)}</>;
}

const ListItem = React.memo(_ListItem) as <T>(
  props: ListItemProps<T>
) => React.ReactNode;


// Example usage of the List component
// interface User {
//     id: number;
//     name: string;
// }

// const users: User[] = [
//     { id: 1, name: 'Alice' },
//     { id: 2, name: 'Bob' },
//     { id: 3, name: 'Charlie' },
// ];

// export function UserList() {
//     return (
//         <List
//             items={users}
//             keyExtractor={(user) => user.id}
//             renderItem={(user) => <div>{user.name}</div>}
//         />
//     );
// }