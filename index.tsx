import React, { useState, useEffect } from "react";
import { ActivityIndicator, Platform, View, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from "react-native";
import * as Contacts from "expo-contacts";
import { debounce } from "lodash";

/*
  - Official documentation says SortType is not supported on iOS but my experience is that it is.
  - Still need to build out for Android.
  - Remember to add permissions to expo app json
  - Dependencies: lodash, expo-contacts
*/

export function ContactsListWrapper({
  onFinish,
  pageSize = 50,
  sort = Contacts.SortTypes.LastName,
  LoadingComponent = Loading,
  PermissionDeniedComponent = NotGranted,
  searchBarTextInputProps,
  searchBarDebounceMS,
  ContactComponent,
  GetMoreComponent,
  contactsListContainerStyle,
  headerStyle,
  doneButtonStyle,
  doneButtonText = "Done",
}) {
  const [perm, setPerm] = useState("asking");
  const [contacts, setContacts] = useState(null);
  const [gettingContacts, setGettingContacts] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [term, setTerm] = useState("");
  const [selectedContacts, setSelectedContacts] = useState([]);

  const getContacts = async (options) => {
    const { data, hasNextPage } = await Contacts.getContactsAsync({
      pageSize,
      sort,
      ...options,
    });
    return { contacts: data, hasNextPage };
  };

  const selectContact = (contact) => {
    const alreadySelected = !!selectedContacts.find((c) => c.id == contact.id);
    if (alreadySelected) {
      setSelectedContacts(selectedContacts.filter((c) => c.id != contact.id));
    } else {
      setSelectedContacts([...selectedContacts, contact]);
    }
  };

  const safeGetContacts = async (options) => {
    if (gettingContacts) {
      return {
        contacts: [],
        hasNextPage: true,
      };
    } else {
      setGettingContacts(true);
      const { contacts, hasNextPage } = await getContacts(options);
      setGettingContacts(false);
      return { contacts, hasNextPage };
    }
  };

  const appendContacts = (newContacts) => {
    setContacts(contacts.concat(newContacts));
  };

  const initialContacts = async () => {
    const { contacts, hasNextPage } = await safeGetContacts({
      pageOffset: 0,
    });
    setContacts(contacts);
    setHasMore(hasNextPage);
  };

  const incPage = async () => {
    setPage(page + 1);
    const { contacts, hasNextPage } = await safeGetContacts({
      pageOffset: (page + 1) * pageSize,
    });
    appendContacts(contacts);
    setHasMore(hasNextPage);
  };

  const onSetTerm = async (text) => {
    setPage(0);
    if (!text) {
      setTerm("");
      initialContacts();
    } else {
      setTerm(text);
      const { contacts, hasNextPage } = await safeGetContacts({
        pageOffset: 0,
        name: text,
      });
      setContacts(contacts);
      setHasMore(hasNextPage);
    }
  };

  const done = () => {
    onFinish(selectedContacts);
  };

  useEffect(() => {
    (async () => {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === "granted") {
        setPerm("granted");
        initialContacts();
      } else {
        setPerm("denied");
      }
    })();
  }, []);

  if (perm === "asking") {
    return null;
  }

  if (perm === "denied") {
    return <PermissionDeniedComponent />;
  }

  if (!contacts) {
    return <LoadingComponent />
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={[styles.header, headerStyle]}>
        <TouchableOpacity onPress={done} style={doneButtonStyle}>
          <Text>{doneButtonText}</Text>
        </TouchableOpacity>
      </View>
      <ContactsSearchBar
        inputProps={searchBarTextInputProps}
        debounceMS={searchBarDebounceMS}
        onSetTerm={onSetTerm}
        style={styles.searchBar} />
      <ContactsList
        ContactComponent={ContactComponent}
        GetMoreComponent={GetMoreComponent}
        listStyle={contactsListContainerStyle}
        contacts={contacts}
        incPage={incPage}
        hasMore={hasMore}
        searchTerm={term}
        selectContact={selectContact}
        selectedContacts={selectedContacts} />
    </SafeAreaView>
  );
};

function Loading() {
  return <Text>{"Loading Contacts..."}</Text>;
};

function NotGranted() {
  return <Text>{"Permission Denied"}</Text>;
};

function ContactsSearchBar({
  onSetTerm,
  inputProps = {},
  debounceMS = 500,
}) {
  if (Platform.OS !== "ios") {
    return null;
  }

  const changeText = debounce((text) => {
    onSetTerm(text);
  }, debounceMS, {
    leading: false,
    trailing: true,
  });

  return (
    <TextInput
      accessible
      placeholder={"Search for contacts by name"}
      placeholderTextColor={"#B7B7CB"}
      multiline={false}
      onChange={() => {}}
      onContentSizeChange={() => {}}
      style={styles.searchBar}
      autoFocus={false}
      onFocus={() => {}}
      autoCorrect={false}
      underlineColorAndroid={"transparent"}
      {...inputProps}
      onChangeText={(text) => {
        inputProps.onChangeText && inputProps.onChangeText(text);
        changeText(text);
      }} />
  );
};

class Contact extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.isSelected != this.props.isSelected) {
      return true;
    }
    return false;
  };

  renderDefaultContact(contact, isSelected) {
    return (
      <View style={[styles.contact, isSelected ? styles.selectedContact : null]}>
        <Text>{contact.name}</Text>
      </View>
    );
  };

  renderContact(contact, isSelected) {
    const { ContactComponent } = this.props;
    return ContactComponent ? <ContactComponent contact={contact} isSelected={isSelected} /> : this.renderDefaultContact(contact, isSelected);
  };

  render() {
    const { contact, isSelected } = this.props;
    return (
      <TouchableOpacity onPress={() => this.props.selectContact(contact)}>
        {this.renderContact(contact, isSelected)}
      </TouchableOpacity>
    );
  };
};

function ContactsList({
  contacts,
  incPage,
  hasMore,
  searchTerm,
  selectContact,
  selectedContacts,
  ContactComponent,
  GetMoreComponent = ActivityIndicator,
  listStyle = styles.contactsList,
}) {
  const footer = () => {
    if (searchTerm) {
      return null;
    }
    if (!hasMore) {
      return null;
    }
    return <GetMoreComponent />;
  };

  const endReached = () => {
    if (searchTerm) {
      return;
    }
    if (!hasMore) {
      return;
    }
    incPage();
  };

  return (
    <FlatList
      style={listStyle}
      ListFooterComponent={footer}
      onEndReached={endReached}
      renderItem={({ item }) => {
        const isSelected = !!selectedContacts.find((c) => c.id == item.id);
        return <Contact
          ContactComponent={ContactComponent}
          contact={item}
          selectContact={selectContact}
          isSelected={isSelected} />;
      }}
      keyExtractor={(item) => item.id}
      data={contacts} />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 20,
    flex: 1,
  },
  contactsList: {
    paddingTop: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  contact: {
    height: 50,
  },
  selectedContact: {
    backgroundColor: "#add8e6",
  },
  searchBar: {
    height: 40,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 5,
    borderBottomColor: "#d3d3d3",
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
