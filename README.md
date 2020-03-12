A UI wrapper for expo's native Contacts API. Renders contacts in a list.

## Installation
```
# yarn
yarn add expo-contacts-wrapper

# npm
npm install expo-contacts-wrapper --save
```

## Usage
```
import { ContactsListWrapper } from "expo-contacts-wrapper";

export default function App() {
  const finishSelectingContacts = (selectedContacts) => {
    console.log("Selected Contacts", selectedContacts);
  };

  return <ContactsListWrapper onFinish={finishSelectingContacts} />;
}
```

## Props
| Prop        | Required?     | Type  | Default | Description |
| ------------- |:-------------:| -----:| ------:| ----------------:|
| `onFinish`  | true | function | None |  Callback when user is done adding contacts. First argument is array of contacts. |
| `pageSize` | false | Integer | 50 | How many contacts to load per page. |
| `sort` | false | SortType | `Contacts.SortTypes.LastName` | Sort type provided by Expo. |
| `LoadingComponent` | false | Component | | Component to show while contacts are loading. |
| `PermissionDeniedComponent` | false | Component | | Component to show when permission to the Contacts list is denied. |
| `searchBarTextInputProps` | false | Object | None | Set of props to pass to `InputText` search box. |
| `searchBarDebounceMS` | false | Integer | 500 | Debounce timer on the search bar. |
| `ContactComponent` | false | Component | | Custom component to render a contact in the list. Is given props `contact` and `isSelected`. |
| `GetMoreComponent` | false | Component | ActivityIndicator | Component to display at bottom of the list when there are more contacts to load. |
| `contactsListContainerStyle` | false | Object | | Styling for list container. |
| `headerStyle` | false | Object | | Styling for header containing "done" button. |
| `doneButtonStyle` | false | Object | | Styling for done button (`TouchableOpacity`. |
| `doneButtonText` | false | String | "Done" | Text content of the done button. |