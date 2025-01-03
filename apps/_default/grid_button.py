class GridActionButton:
 def __init__(
     self,
     url,
     text=None,
     icon=None,
     additional_classes="",
     additional_styles="",
     override_classes="",
     override_styles="",
     message="",
     append_id=False,
     name=None,
     ignore_attribute_plugin=False,
     **attrs
 ):
     self.url = url
     self.text = text
     self.icon = icon
     self.additional_classes = additional_classes
     self.additional_styles = additional_styles
     self.override_classes = override_classes
     self.override_styles = override_styles
     self.message = message
     self.append_id = append_id
     self.name = name
     self.ignore_attribute_plugin = ignore_attribute_plugin
     self.attrs = attrs